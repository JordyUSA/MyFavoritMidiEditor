import { Midi } from '@tonejs/midi';
import { createTrack, createWaveform } from '@/state/factories';
import { nextColor } from '@/utils/color';
import type { Note, TempoMarker, TimeSignatureMarker, Track, Waveform } from '@/state/types';
import { detectTempo, type TempoDetectionResult } from './tempoDetect';

export interface MidiImportResult {
  waveform: Waveform;
  tempoMap: TempoMarker[];
  timeSignatureMap: TimeSignatureMarker[];
  detection: TempoDetectionResult;
}

/**
 * Parses a Standard MIDI File and auto-arranges it into one Waveform whose
 * tracks are already split one-per-instrument (courtesy of @tonejs/midi,
 * which itself splits multi-channel/multi-program tracks apart on parse).
 */
export function parseMidiFile(buffer: ArrayBuffer, fileName: string): MidiImportResult {
  const midi = new Midi(buffer);
  const ppq = midi.header.ppq;
  const detection = detectTempo(midi);

  const tempoMap: TempoMarker[] =
    midi.header.tempos.length > 0
      ? midi.header.tempos.map((t) => ({ beat: t.ticks / ppq, bpm: t.bpm }))
      : [{ beat: 0, bpm: 120 }];

  const timeSignatureMap: TimeSignatureMarker[] =
    midi.header.timeSignatures.length > 0
      ? midi.header.timeSignatures.map((ts) => ({
          beat: ts.ticks / ppq,
          numerator: ts.timeSignature[0],
          denominator: ts.timeSignature[1],
        }))
      : [{ beat: 0, numerator: 4, denominator: 4 }];

  const tracks: Track[] = midi.tracks
    .filter((t) => t.notes.length > 0)
    .map((t, i) => {
      const isDrumKit = t.instrument.percussion;
      const notes: Note[] = t.notes.map((n) => ({
        id: `note_${i}_${n.ticks}_${n.midi}_${Math.random().toString(36).slice(2, 8)}`,
        pitch: n.midi,
        start: n.ticks / ppq,
        duration: Math.max(1 / 32, n.durationTicks / ppq),
        velocity: Math.max(1, Math.round(n.velocity * 127)),
      }));

      return createTrack({
        name: t.name || t.instrument.name || `${isDrumKit ? 'Drums' : 'Instrument'} ${i + 1}`,
        color: nextColor(),
        instrument: {
          program: t.instrument.number,
          isDrumKit,
          source: 'synth',
          name: isDrumKit ? 'Standard Drum Kit' : t.instrument.name,
        },
        midiChannel: t.channel,
        notes,
      });
    });

  const waveform = createWaveform({
    name: fileName.replace(/\.(mid|midi)$/i, ''),
    tracks,
    importInfo: {
      sourceFileName: fileName,
      detectedBpm: detection.bpm,
      detectedTimeSignature: detection.timeSignature,
      tempoConfidence: detection.confidence,
      timingConfirmed: true,
    },
  });

  return { waveform, tempoMap, timeSignatureMap, detection };
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
