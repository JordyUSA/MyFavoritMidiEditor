import * as Tone from 'tone';
import { Soundfont, SplendidGrandPiano, Sampler, type Smplr } from 'smplr';
import { gmFamilyForProgram, midiToNoteName, GM_DRUM_NOTES } from '@/utils/gmInstruments';
import { gmSoundfontSlug } from './gmSoundfontNames';
import { DEFAULT_DRUM_MACHINE, drumSampleUrlsFor, drumLabel, type DrumMachineName } from './drumMachineMap';
import { makeThrottledLoader } from './bufferLoader';
import { DrumKit } from './drumKit';
import type { InstrumentSpec } from '@/state/types';

export type LoadProgress = { loaded: number; total: number };

export type PlayableInstrument =
  | { kind: 'synth'; node: Tone.PolySynth }
  | { kind: 'synthDrums'; node: DrumKit }
  | {
      kind: 'sampled';
      smplr: Smplr;
      /** Tone-connectable entry point: smplr writes into `bridge.input` (a real native GainNode). */
      bridge: Tone.Gain;
      ready: Promise<void>;
      /** Maps a GM pitch to whatever `smplr.start({ note })` expects (a MIDI number for melodic instruments, a sample-group name for drum machines). */
      noteFor: (pitch: number) => string | number;
    };

interface FamilyPreset {
  voice: 'synth' | 'mono' | 'fm' | 'am';
  oscillator: Partial<Tone.OmniOscillatorOptions>;
  envelope: Partial<Tone.EnvelopeOptions>;
}

const DEFAULT_PRESET: FamilyPreset = {
  voice: 'synth',
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.6 },
};

const FAMILY_PRESETS: Record<string, FamilyPreset> = {
  Piano: { voice: 'synth', oscillator: { type: 'triangle8' }, envelope: { attack: 0.004, decay: 1.2, sustain: 0.05, release: 0.8 } },
  'Chromatic Percussion': { voice: 'fm', oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 } },
  Organ: { voice: 'synth', oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.15 } },
  Guitar: { voice: 'am', oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.2, release: 0.5 } },
  Bass: { voice: 'mono', oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 } },
  Strings: { voice: 'synth', oscillator: { type: 'sawtooth' }, envelope: { attack: 0.35, decay: 0.2, sustain: 0.8, release: 0.9 } },
  Ensemble: { voice: 'synth', oscillator: { type: 'fatsawtooth' }, envelope: { attack: 0.25, decay: 0.2, sustain: 0.85, release: 1.0 } },
  Brass: { voice: 'synth', oscillator: { type: 'sawtooth' }, envelope: { attack: 0.08, decay: 0.15, sustain: 0.75, release: 0.35 } },
  Reed: { voice: 'synth', oscillator: { type: 'square' }, envelope: { attack: 0.06, decay: 0.1, sustain: 0.8, release: 0.25 } },
  Pipe: { voice: 'synth', oscillator: { type: 'sine' }, envelope: { attack: 0.06, decay: 0.1, sustain: 0.85, release: 0.3 } },
  'Synth Lead': { voice: 'synth', oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 } },
  'Synth Pad': { voice: 'synth', oscillator: { type: 'fatsine' }, envelope: { attack: 0.8, decay: 0.3, sustain: 0.9, release: 1.5 } },
  'Synth Effects': { voice: 'fm', oscillator: { type: 'sine' }, envelope: { attack: 0.3, decay: 0.4, sustain: 0.5, release: 1.2 } },
  Ethnic: { voice: 'am', oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.4 } },
  Percussive: { voice: 'fm', oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 } },
  'Sound Effects': { voice: 'fm', oscillator: { type: 'sine' }, envelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 0.8 } },
};

function presetForProgram(program: number): FamilyPreset {
  const family = gmFamilyForProgram(program).name;
  return FAMILY_PRESETS[family] ?? DEFAULT_PRESET;
}

function createSynthInstrument(spec: InstrumentSpec): PlayableInstrument {
  if (spec.isDrumKit) return { kind: 'synthDrums', node: new DrumKit() };

  const preset = presetForProgram(spec.program);
  switch (preset.voice) {
    case 'mono':
      return { kind: 'synth', node: new Tone.PolySynth(Tone.MonoSynth, { oscillator: preset.oscillator, envelope: preset.envelope } as any) };
    case 'fm':
      return { kind: 'synth', node: new Tone.PolySynth(Tone.FMSynth, { envelope: preset.envelope } as any) };
    case 'am':
      return { kind: 'synth', node: new Tone.PolySynth(Tone.AMSynth, { envelope: preset.envelope } as any) };
    case 'synth':
    default:
      return { kind: 'synth', node: new Tone.PolySynth(Tone.Synth, { oscillator: preset.oscillator, envelope: preset.envelope } as any) };
  }
}

/**
 * Builds a playable instrument for `spec` against `ctx` (a live AudioContext
 * for real playback, or an OfflineContext's rawContext for rendering).
 * 'soundfont' instruments fetch real sampled audio from a public CDN
 * (https://smpldsnds.github.io / midi-js-soundfonts) the first time each
 * note/kit is used — `ready` resolves once the initial batch has loaded.
 * Falls back to the offline synth engine if `spec.source` is `'synth'`.
 */
/** All standard GM percussion pitches — used to size a drum sampler when the caller doesn't know which pitches it'll need up front (e.g. click-to-preview). */
const ALL_GM_DRUM_PITCHES = GM_DRUM_NOTES.map((d) => d.pitch);

export function createPlayableInstrument(
  spec: InstrumentSpec,
  ctx: BaseAudioContext,
  onLoadProgress?: (p: LoadProgress) => void,
  /** Pitches this instrument actually needs to play — lets a drum kit fetch only the handful of real samples it uses instead of the whole 100+ sample kit. Defaults to every GM drum pitch. */
  pitchesNeeded?: number[],
): PlayableInstrument {
  if (spec.source === 'synth') return createSynthInstrument(spec);

  const bridge = new Tone.Gain();

  if (spec.isDrumKit) {
    const kit = (spec.drumKitName as DrumMachineName) ?? DEFAULT_DRUM_MACHINE;
    const pitches = pitchesNeeded && pitchesNeeded.length > 0 ? pitchesNeeded : ALL_GM_DRUM_PITCHES;
    const smplr = Sampler(ctx, {
      buffers: makeThrottledLoader(drumSampleUrlsFor(kit, pitches)),
      destination: bridge.input,
      onLoadProgress,
    });
    return {
      kind: 'sampled',
      smplr,
      bridge,
      ready: smplr.ready,
      noteFor: (pitch) => drumLabel(pitch),
    };
  }

  const isPiano = spec.program === 0;
  const smplr = isPiano
    ? SplendidGrandPiano(ctx, { destination: bridge.input, onLoadProgress })
    : Soundfont(ctx, { instrument: gmSoundfontSlug(spec.program), kit: 'MusyngKite', destination: bridge.input, onLoadProgress });

  return { kind: 'sampled', smplr, bridge, ready: smplr.ready, noteFor: (pitch) => pitch };
}

export function triggerNote(
  instrument: PlayableInstrument,
  pitch: number,
  durationSeconds: number,
  time: number,
  velocity: number,
): void {
  const clampedVelocity = Math.max(1, Math.min(127, velocity));
  switch (instrument.kind) {
    case 'synth':
      instrument.node.triggerAttackRelease(midiToNoteName(pitch), Math.max(0.03, durationSeconds), time, clampedVelocity / 127);
      break;
    case 'synthDrums':
      instrument.node.triggerAttackRelease(pitch, durationSeconds, time, clampedVelocity / 127);
      break;
    case 'sampled':
      instrument.smplr.start({
        note: instrument.noteFor(pitch),
        velocity: clampedVelocity,
        time,
        duration: Math.max(0.02, durationSeconds),
      });
      break;
  }
}

export function instrumentOutputNode(instrument: PlayableInstrument): Tone.ToneAudioNode {
  switch (instrument.kind) {
    case 'synth':
      return instrument.node;
    case 'synthDrums':
      return instrument.node.output;
    case 'sampled':
      return instrument.bridge;
  }
}

export function disposeInstrument(instrument: PlayableInstrument): void {
  switch (instrument.kind) {
    case 'synth':
    case 'synthDrums':
      instrument.node.dispose();
      break;
    case 'sampled':
      instrument.smplr.dispose();
      instrument.bridge.dispose();
      break;
  }
}
