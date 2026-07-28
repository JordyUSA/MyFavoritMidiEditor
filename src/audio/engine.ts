import * as Tone from 'tone';
import type { Project, Track, TempoMarker, TimeSignatureMarker } from '@/state/types';
import { flattenProject, projectEndBeat } from '@/utils/flatten';
import { beatsToSeconds, secondsToBeats, timeSignatureAtBeat } from '@/utils/time';
import { createPlayableInstrument, disposeInstrument, instrumentOutputNode, triggerNote, type PlayableInstrument, type LoadProgress } from './instruments';
import { createToneEffect, updateToneEffect } from './effects';
import { audioBufferToWav } from './wavEncoder';

interface LiveTrack {
  trackId: string;
  instrument: PlayableInstrument;
  effectNodes: Tone.ToneAudioNode[];
  channel: Tone.Channel;
  part: Tone.Part;
}

const SAMPLE_LOAD_TIMEOUT_MS = 18000;

/**
 * Waits for `promise` up to `ms`, but never rejects: a flaky network mid-fetch
 * (or a CDN that's briefly unreachable) should silently fall back rather than
 * take down playback. Individual failed samples are already handled inside
 * `smplr` (that track's sound is just missing); this guards against the
 * fetch itself throwing (e.g. a connection reset), which smplr does not
 * catch, from becoming an unhandled rejection.
 */
function withTimeout(promise: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([
    promise.then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

/**
 * Owns the whole live playback graph: one instrument + effect chain + mixer
 * channel per un-muted track, feeding a shared master bus. Also supports
 * offline (faster-than-realtime) rendering to a WAV file for export.
 *
 * Playback is scheduled in absolute seconds (derived from the project's own
 * tempo map via beatsToSeconds), so Tone.Transport's own bpm setting is left
 * at its default and never consulted — this lets a single project contain
 * tempo changes without fighting Tone's transport-tempo automation.
 *
 * Instruments with `source: 'soundfont'` play real sampled audio (fetched
 * from a public CDN the first time each sound is used); `play()` waits for
 * that initial fetch (up to SAMPLE_LOAD_TIMEOUT_MS) before starting the
 * transport, reporting progress via `opts.onLoadProgress`.
 */
export class AudioEngine {
  private masterVolume: Tone.Volume;
  private limiter: Tone.Limiter;
  private liveTracks: LiveTrack[] = [];
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private metronomeAccent: Tone.MetalSynth | null = null;
  private metronomePart: Tone.Part | null = null;
  private tempoMap: TempoMarker[] = [{ beat: 0, bpm: 120 }];
  private playToken = 0;

  constructor() {
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.masterVolume = new Tone.Volume(0).connect(this.limiter);
  }

  private teardown(): void {
    for (const lt of this.liveTracks) {
      lt.part.dispose();
      disposeInstrument(lt.instrument);
      lt.effectNodes.forEach((n) => n.dispose());
      lt.channel.dispose();
    }
    this.liveTracks = [];
    this.metronomePart?.dispose();
    this.metronomePart = null;
    this.metronomeSynth?.dispose();
    this.metronomeSynth = null;
    this.metronomeAccent?.dispose();
    this.metronomeAccent = null;
  }

  private buildChain(
    track: Track,
    ctx: BaseAudioContext,
    destination: Tone.ToneAudioNode,
    onLoadProgress?: (p: LoadProgress) => void,
  ): { instrument: PlayableInstrument; effectNodes: Tone.ToneAudioNode[]; channel: Tone.Channel } {
    const pitchesNeeded = Array.from(new Set(track.notes.map((n) => n.pitch)));
    const instrument = createPlayableInstrument(track.instrument, ctx, onLoadProgress, pitchesNeeded);
    const channel = new Tone.Channel({ volume: track.volume, pan: track.pan, mute: false }).connect(destination);
    const effectNodes = track.effects.map((fx) => createToneEffect(fx));

    let node: Tone.ToneAudioNode = instrumentOutputNode(instrument);
    for (const fx of effectNodes) {
      node.connect(fx);
      node = fx;
    }
    node.connect(channel);
    return { instrument, effectNodes, channel };
  }

  private buildMetronome(destination: Tone.ToneAudioNode, project: Project, endBeat: number): Tone.Part {
    this.metronomeSynth = new Tone.MembraneSynth({
      envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
      octaves: 3,
    }).connect(destination);
    this.metronomeAccent = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
      harmonicity: 6,
      resonance: 5000,
      octaves: 1,
    }).connect(destination);

    const events: { time: number; accent: boolean }[] = [];
    let beat = 0;
    let barBeatCounter = 0;
    while (beat <= endBeat + 4) {
      const sig = timeSignatureAtBeat(beat, project.timeSignatureMap);
      const isDownbeat = barBeatCounter === 0;
      events.push({ time: beatsToSeconds(beat, project.tempoMap), accent: isDownbeat });
      barBeatCounter = (barBeatCounter + 1) % Math.max(1, Math.round(sig.numerator));
      beat += 1;
    }

    const part = new Tone.Part((time, ev: { accent: boolean }) => {
      if (ev.accent) this.metronomeAccent!.triggerAttackRelease('C6', 0.03, time, 0.6);
      else this.metronomeSynth!.triggerAttackRelease('C3', 0.05, time, 0.4);
    }, events.map((e) => ({ time: e.time, accent: e.accent })));
    part.start(0);
    return part;
  }

  /** (Re)builds the whole graph from the current project and starts playback from `startBeat`. */
  async play(
    project: Project,
    opts: {
      startBeat: number;
      metronome: boolean;
      loop: { enabled: boolean; startBeat: number; endBeat: number };
      onLoadingChange?: (loading: boolean) => void;
    },
  ): Promise<void> {
    const token = ++this.playToken;
    await Tone.start();
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel(0);
    this.teardown();

    this.tempoMap = project.tempoMap;
    this.masterVolume.volume.value = project.masterVolume;
    const ctx = Tone.getContext().rawContext as unknown as BaseAudioContext;

    const flat = flattenProject(project).filter((ft) => !ft.effectivelyMuted);
    const readyPromises: Promise<void>[] = [];
    for (const ft of flat) {
      const { instrument, effectNodes, channel } = this.buildChain(ft.track, ctx, this.masterVolume);
      if (instrument.kind === 'sampled') readyPromises.push(instrument.ready.catch(() => undefined));
      const events = ft.notes.map((n) => ({
        time: beatsToSeconds(n.absoluteStart, project.tempoMap),
        pitch: n.pitch,
        durationSeconds: Math.max(
          0.02,
          beatsToSeconds(n.absoluteStart + n.duration, project.tempoMap) - beatsToSeconds(n.absoluteStart, project.tempoMap),
        ),
        velocity: n.velocity,
      }));
      const part = new Tone.Part((time, ev: (typeof events)[number]) => {
        triggerNote(instrument, ev.pitch, ev.durationSeconds, time, ev.velocity);
      }, events);
      part.start(0);
      this.liveTracks.push({ trackId: ft.track.id, instrument, effectNodes, channel, part });
    }

    if (readyPromises.length > 0) {
      opts.onLoadingChange?.(true);
      await withTimeout(Promise.all(readyPromises), SAMPLE_LOAD_TIMEOUT_MS);
      opts.onLoadingChange?.(false);
    }
    if (token !== this.playToken) return; // superseded by a newer play()/stop() while we were loading

    const endBeat = Math.max(projectEndBeat(project), opts.loop.endBeat);
    if (opts.metronome) {
      this.metronomePart = this.buildMetronome(this.masterVolume, project, endBeat);
    }

    if (opts.loop.enabled) {
      const loopStartSec = beatsToSeconds(opts.loop.startBeat, project.tempoMap);
      const loopEndSec = Math.max(loopStartSec + 0.1, beatsToSeconds(opts.loop.endBeat, project.tempoMap));
      transport.loop = true;
      transport.loopStart = loopStartSec;
      transport.loopEnd = loopEndSec;
      for (const lt of this.liveTracks) {
        lt.part.loop = true;
        lt.part.loopStart = loopStartSec;
        lt.part.loopEnd = loopEndSec;
      }
      if (this.metronomePart) {
        this.metronomePart.loop = true;
        this.metronomePart.loopStart = loopStartSec;
        this.metronomePart.loopEnd = loopEndSec;
      }
    } else {
      transport.loop = false;
    }

    transport.seconds = beatsToSeconds(opts.startBeat, project.tempoMap);
    transport.start();
  }

  pause(): void {
    Tone.getTransport().pause();
  }

  resume(): void {
    Tone.getTransport().start();
  }

  stop(): void {
    this.playToken++;
    const transport = Tone.getTransport();
    transport.stop();
    transport.seconds = 0;
  }

  seekToBeat(beat: number): void {
    Tone.getTransport().seconds = beatsToSeconds(beat, this.tempoMap);
  }

  getCurrentBeat(): number {
    return secondsToBeats(Tone.getTransport().seconds, this.tempoMap);
  }

  /** Live-updates volume/pan/effect params on already-playing tracks without retriggering notes. */
  syncLiveParams(project: Project): void {
    this.masterVolume.volume.value = project.masterVolume;
    const anySolo = project.waveforms.some((w) => w.tracks.some((t) => t.solo));
    for (const w of project.waveforms) {
      for (const t of w.tracks) {
        const live = this.liveTracks.find((lt) => lt.trackId === t.id);
        if (!live) continue;
        live.channel.volume.value = t.volume;
        live.channel.pan.value = t.pan;
        live.channel.mute = w.muted || t.muted || (anySolo && !t.solo);
        t.effects.forEach((fx, i) => {
          if (live.effectNodes[i]) updateToneEffect(live.effectNodes[i], fx);
        });
      }
    }
  }

  dispose(): void {
    this.teardown();
    this.masterVolume.dispose();
    this.limiter.dispose();
  }

  /** Renders the project to a WAV Blob, faster than real time, using an offline audio context. */
  async renderToWav(project: Project, onLoadProgress?: (p: LoadProgress) => void): Promise<Blob> {
    const endBeat = projectEndBeat(project) + 4;
    const durationSeconds = beatsToSeconds(endBeat, project.tempoMap) + 2;

    const buffer = await Tone.Offline(async ({ transport, rawContext }) => {
      const limiter = new Tone.Limiter(-1).toDestination();
      const master = new Tone.Volume(project.masterVolume).connect(limiter);
      const flat = flattenProject(project).filter((ft) => !ft.effectivelyMuted);

      const readyPromises: Promise<void>[] = [];
      for (const ft of flat) {
        const pitchesNeeded = Array.from(new Set(ft.notes.map((n) => n.pitch)));
        const instrument = createPlayableInstrument(ft.track.instrument, rawContext as unknown as BaseAudioContext, onLoadProgress, pitchesNeeded);
        if (instrument.kind === 'sampled') readyPromises.push(instrument.ready.catch(() => undefined));
        const channel = new Tone.Channel({ volume: ft.track.volume, pan: ft.track.pan }).connect(master);
        const effectNodes = ft.track.effects.map((fx) => createToneEffect(fx));
        let node: Tone.ToneAudioNode = instrumentOutputNode(instrument);
        for (const fx of effectNodes) {
          node.connect(fx);
          node = fx;
        }
        node.connect(channel);

        for (const n of ft.notes) {
          const start = beatsToSeconds(n.absoluteStart, project.tempoMap);
          const end = beatsToSeconds(n.absoluteStart + n.duration, project.tempoMap);
          transport.schedule((time) => {
            triggerNote(instrument, n.pitch, Math.max(0.02, end - start), time, n.velocity);
          }, start);
        }
      }
      await withTimeout(Promise.all(readyPromises), SAMPLE_LOAD_TIMEOUT_MS);
      transport.start();
    }, durationSeconds);

    return audioBufferToWav(buffer.get() as unknown as AudioBuffer);
  }
}

export const audioEngine = new AudioEngine();
