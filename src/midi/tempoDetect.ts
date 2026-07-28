import type { Midi } from '@tonejs/midi';

export interface TempoDetectionResult {
  bpm: number;
  timeSignature: [number, number];
  confidence: 'explicit' | 'default' | 'variable';
  tempoChangeCount: number;
  message: string;
}

/**
 * Reads the header meta-events of an imported MIDI file and summarizes what
 * tempo/time-signature information it carries, in plain language suitable
 * for showing the user a confirm/deny prompt.
 */
export function detectTempo(midi: Midi): TempoDetectionResult {
  const tempos = midi.header.tempos;
  const timeSignatures = midi.header.timeSignatures;

  const bpm = tempos.length > 0 ? Math.round(tempos[0].bpm * 10) / 10 : 120;
  const timeSignature: [number, number] =
    timeSignatures.length > 0
      ? [timeSignatures[0].timeSignature[0], timeSignatures[0].timeSignature[1]]
      : [4, 4];

  let confidence: TempoDetectionResult['confidence'];
  let message: string;

  if (tempos.length === 0) {
    confidence = 'default';
    message = `This file has no tempo marking, so we assumed ${bpm} BPM in ${timeSignature[0]}/${timeSignature[1]}.`;
  } else if (tempos.length === 1) {
    confidence = 'explicit';
    message = `Detected ${bpm} BPM in ${timeSignature[0]}/${timeSignature[1]} from the file's own tempo marking.`;
  } else {
    confidence = 'variable';
    message = `Detected a starting tempo of ${bpm} BPM in ${timeSignature[0]}/${timeSignature[1]}, with ${
      tempos.length - 1
    } additional tempo change${tempos.length - 1 === 1 ? '' : 's'} later in the file.`;
  }

  return { bpm, timeSignature, confidence, tempoChangeCount: tempos.length, message };
}
