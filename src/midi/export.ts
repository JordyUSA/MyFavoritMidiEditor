import { Midi } from '@tonejs/midi';
import type { Project } from '@/state/types';
import { flattenProject } from '@/utils/flatten';

const PPQ = 480;

/** Serializes the whole project (or just the un-muted parts) to a Standard MIDI File. */
export function exportProjectToMidi(project: Project, opts: { includeMuted?: boolean } = {}): Uint8Array {
  const midi = new Midi();
  // A fresh Midi()'s header already defaults to 480 ppq, matching PPQ below.
  midi.name = project.name;

  midi.header.tempos = project.tempoMap.map((m) => ({
    ticks: Math.round(m.beat * PPQ),
    bpm: m.bpm,
  }));
  midi.header.timeSignatures = project.timeSignatureMap.map((m) => ({
    ticks: Math.round(m.beat * PPQ),
    timeSignature: [m.numerator, m.denominator],
  }));

  const flat = flattenProject(project);
  let usedDrumChannel = false;

  for (const ft of flat) {
    if (!opts.includeMuted && ft.effectivelyMuted) continue;
    const track = midi.addTrack();
    track.name = ft.track.name;
    track.channel = ft.track.instrument.isDrumKit ? 9 : ft.track.midiChannel === 9 ? 0 : ft.track.midiChannel;
    if (ft.track.instrument.isDrumKit) usedDrumChannel = true;
    track.instrument.number = ft.track.instrument.isDrumKit ? 0 : ft.track.instrument.program;

    for (const note of ft.notes) {
      track.addNote({
        midi: note.pitch,
        ticks: Math.max(0, Math.round(note.absoluteStart * PPQ)),
        durationTicks: Math.max(1, Math.round(note.duration * PPQ)),
        velocity: Math.max(1, Math.min(127, note.velocity)) / 127,
      });
    }
  }

  void usedDrumChannel;
  return midi.toArray();
}

export function downloadMidi(project: Project, fileName?: string): void {
  const bytes = exportProjectToMidi(project);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
  triggerDownload(blob, `${(fileName ?? project.name) || 'project'}.mid`);
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
