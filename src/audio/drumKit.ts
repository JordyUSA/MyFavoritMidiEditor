import * as Tone from 'tone';

type DrumVoice = 'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat' | 'tom' | 'cymbal' | 'ride' | 'default';

/** Buckets the 47-key GM percussion map down to a handful of synthesized voice types. */
function voiceForPitch(pitch: number): DrumVoice {
  if (pitch === 35 || pitch === 36) return 'kick';
  if (pitch === 38 || pitch === 40) return 'snare';
  if (pitch === 39) return 'clap';
  if (pitch === 42 || pitch === 44) return 'closedHat';
  if (pitch === 46) return 'openHat';
  if ([41, 43, 45, 47, 48, 50].includes(pitch)) return 'tom';
  if ([51, 59, 53].includes(pitch)) return 'ride';
  if ([49, 52, 55, 57].includes(pitch)) return 'cymbal';
  return 'default';
}

/**
 * A synthesized General MIDI-ish drum kit: no sample loading required, so it
 * works fully offline. Each GM percussion key is routed to a small synth
 * tuned to sound roughly like that drum.
 */
export class DrumKit {
  readonly output: Tone.Channel;
  private kick: Tone.MembraneSynth;
  private tom: Tone.MembraneSynth;
  private snare: Tone.NoiseSynth;
  private clap: Tone.NoiseSynth;
  private closedHat: Tone.MetalSynth;
  private openHat: Tone.MetalSynth;
  private cymbal: Tone.MetalSynth;
  private ride: Tone.MetalSynth;

  constructor() {
    this.output = new Tone.Channel();

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.4 },
    }).connect(this.output);

    this.tom = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.3 },
    }).connect(this.output);

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(this.output);

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0 },
    }).connect(this.output);

    this.closedHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.output);

    this.openHat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.output);

    this.cymbal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.4, release: 0.6 },
      harmonicity: 4.2,
      modulationIndex: 24,
      resonance: 3000,
      octaves: 2.5,
    }).connect(this.output);

    this.ride = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.9, release: 0.4 },
      harmonicity: 5.5,
      modulationIndex: 20,
      resonance: 5000,
      octaves: 1.8,
    }).connect(this.output);
  }

  triggerAttackRelease(pitch: number, _duration: number, time: number, velocity: number): void {
    const voice = voiceForPitch(pitch);
    const v = Math.max(0.05, Math.min(1, velocity));
    switch (voice) {
      case 'kick':
        this.kick.triggerAttackRelease('C1', 0.3, time, v);
        break;
      case 'tom':
        this.tom.triggerAttackRelease(pitch < 45 ? 'G1' : pitch < 48 ? 'C2' : 'E2', 0.25, time, v);
        break;
      case 'snare':
        this.snare.triggerAttackRelease(0.18, time, v);
        break;
      case 'clap':
        this.clap.triggerAttackRelease(0.22, time, v);
        break;
      case 'closedHat':
        this.closedHat.triggerAttackRelease('C6', 0.06, time, v * 0.8);
        break;
      case 'openHat':
        this.openHat.triggerAttackRelease('C6', 0.3, time, v * 0.8);
        break;
      case 'cymbal':
        this.cymbal.triggerAttackRelease('C5', 1.2, time, v * 0.9);
        break;
      case 'ride':
        this.ride.triggerAttackRelease('C5', 0.8, time, v * 0.7);
        break;
      default:
        this.snare.triggerAttackRelease(0.15, time, v * 0.6);
    }
  }

  dispose(): void {
    [this.kick, this.tom, this.snare, this.clap, this.closedHat, this.openHat, this.cymbal, this.ride].forEach((n) =>
      n.dispose(),
    );
    this.output.dispose();
  }
}
