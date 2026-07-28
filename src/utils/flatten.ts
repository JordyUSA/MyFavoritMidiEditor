import type { Note, Project, Track } from '@/state/types';

export interface FlatNote extends Note {
  /** Absolute beat position, i.e. waveform.startOffset + note.start. */
  absoluteStart: number;
}

export interface FlatTrack {
  waveformId: string;
  waveformName: string;
  track: Track;
  /** True if the track (or its parent waveform) is muted. */
  effectivelyMuted: boolean;
  notes: FlatNote[];
}

/**
 * Flattens every waveform/track/note in a project onto one absolute
 * beat-timeline. Used by MIDI export, MusicXML export, and the audio engine
 * so they all agree on where a note actually sits.
 */
export function flattenProject(project: Project): FlatTrack[] {
  const anySolo = project.waveforms.some((w) => w.tracks.some((t) => t.solo));

  return project.waveforms.flatMap((w) =>
    w.tracks.map((t) => ({
      waveformId: w.id,
      waveformName: w.name,
      track: t,
      effectivelyMuted: w.muted || t.muted || (anySolo && !t.solo),
      notes: t.notes
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((n) => ({ ...n, absoluteStart: w.startOffset + n.start })),
    })),
  );
}

export function projectEndBeat(project: Project): number {
  let end = 0;
  for (const w of project.waveforms) {
    for (const t of w.tracks) {
      for (const n of t.notes) {
        end = Math.max(end, w.startOffset + n.start + n.duration);
      }
    }
  }
  return end;
}
