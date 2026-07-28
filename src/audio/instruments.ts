import * as Tone from 'tone';
import { gmFamilyForProgram } from '@/utils/gmInstruments';
import { midiToNoteName } from '@/utils/gmInstruments';
import { DrumKit } from './drumKit';
import type { InstrumentSpec } from '@/state/types';

export type MelodicInstrument = Tone.PolySynth;
export type PlayableInstrument = MelodicInstrument | DrumKit;

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

export function createInstrument(spec: InstrumentSpec): PlayableInstrument {
  if (spec.isDrumKit) return new DrumKit();

  const preset = presetForProgram(spec.program);
  switch (preset.voice) {
    case 'mono':
      return new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: preset.oscillator,
        envelope: preset.envelope,
      } as any);
    case 'fm':
      return new Tone.PolySynth(Tone.FMSynth, {
        envelope: preset.envelope,
      } as any);
    case 'am':
      return new Tone.PolySynth(Tone.AMSynth, {
        envelope: preset.envelope,
      } as any);
    case 'synth':
    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: preset.oscillator,
        envelope: preset.envelope,
      } as any);
  }
}

export function triggerNote(
  instrument: PlayableInstrument,
  pitch: number,
  durationSeconds: number,
  time: number,
  velocity: number,
): void {
  const v = Math.max(0.02, Math.min(1, velocity / 127));
  if (instrument instanceof DrumKit) {
    instrument.triggerAttackRelease(pitch, durationSeconds, time, v);
  } else {
    instrument.triggerAttackRelease(midiToNoteName(pitch), Math.max(0.03, durationSeconds), time, v);
  }
}

export function disposeInstrument(instrument: PlayableInstrument): void {
  instrument.dispose();
}

/** DrumKit isn't itself a Tone audio node (it fans out to several synths internally) — connect its `.output` instead. */
export function instrumentOutputNode(instrument: PlayableInstrument): Tone.ToneAudioNode {
  return instrument instanceof DrumKit ? instrument.output : (instrument as unknown as Tone.ToneAudioNode);
}
