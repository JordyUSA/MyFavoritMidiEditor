import { create } from 'zustand';
import { createEmptyProject, createNote, createTrack, createWaveform, createEffect } from './factories';
import { pushHistory } from './history';
import { makeId } from '@/utils/id';
import { snapBeat } from '@/utils/time';
import type {
  EffectType,
  ID,
  Note,
  Project,
  TempoMarker,
  TimeSignatureMarker,
  Track,
  Waveform,
} from './types';

interface Selection {
  waveformId: ID | null;
  trackId: ID | null;
  noteIds: ID[];
}

interface ProjectStoreState {
  project: Project;
  past: Project[];
  future: Project[];
  dragSnapshot: Project | null;
  selection: Selection;

  // history
  undo: () => void;
  redo: () => void;
  beginInteraction: () => void;
  commitInteraction: () => void;
  cancelInteraction: () => void;

  // project
  newProject: (name?: string) => void;
  loadProject: (project: Project) => void;
  renameProject: (name: string) => void;
  setMasterVolume: (v: number) => void;
  setSwing: (v: number) => void;
  addTempoMarker: (marker: TempoMarker) => void;
  updateTempoMarker: (beat: number, patch: Partial<TempoMarker>) => void;
  removeTempoMarker: (beat: number) => void;
  addTimeSignatureMarker: (marker: TimeSignatureMarker) => void;
  removeTimeSignatureMarker: (beat: number) => void;
  setProjectMeta: (meta: Partial<NonNullable<Project['meta']>>) => void;

  // waveform
  addWaveformObject: (waveform: Waveform) => void;
  addWaveform: (name?: string) => ID;
  removeWaveform: (id: ID) => void;
  renameWaveform: (id: ID, name: string) => void;
  setWaveformOffsetTransient: (id: ID, offset: number) => void;
  setWaveformMuted: (id: ID, muted: boolean) => void;
  toggleWaveformCollapsed: (id: ID) => void;
  duplicateWaveform: (id: ID) => void;
  confirmWaveformTiming: (id: ID, confirmed: boolean) => void;

  // track
  addTrack: (waveformId: ID, track?: Partial<Track>) => ID;
  removeTrack: (waveformId: ID, trackId: ID) => void;
  updateTrack: (waveformId: ID, trackId: ID, patch: Partial<Track>) => void;
  addEffect: (waveformId: ID, trackId: ID, type: EffectType) => void;
  removeEffect: (waveformId: ID, trackId: ID, effectId: ID) => void;
  updateEffect: (waveformId: ID, trackId: ID, effectId: ID, patch: Partial<Track['effects'][number]>) => void;

  // notes
  addNote: (waveformId: ID, trackId: ID, note: Partial<Note> & Pick<Note, 'pitch' | 'start' | 'duration'>) => ID;
  updateNote: (waveformId: ID, trackId: ID, noteId: ID, patch: Partial<Note>) => void;
  updateNoteTransient: (waveformId: ID, trackId: ID, noteId: ID, patch: Partial<Note>) => void;
  removeNotes: (waveformId: ID, trackId: ID, noteIds: ID[]) => void;
  moveNotesTransient: (waveformId: ID, trackId: ID, noteIds: ID[], deltaPitch: number, deltaBeat: number) => void;
  setNotePositionsTransient: (waveformId: ID, trackId: ID, updates: { id: ID; start: number; pitch: number }[]) => void;
  quantizeNotes: (waveformId: ID, trackId: ID, noteIds: ID[], gridBeats: number) => void;
  transposeNotes: (waveformId: ID, trackId: ID, noteIds: ID[], semitones: number) => void;
  insertNotes: (waveformId: ID, trackId: ID, notes: Note[]) => void;

  // selection
  setActiveTrack: (waveformId: ID | null, trackId: ID | null) => void;
  selectNotes: (ids: ID[], additive?: boolean) => void;
  toggleNoteSelection: (id: ID) => void;
  clearSelection: () => void;
}

function touch(project: Project): Project {
  return { ...project, modifiedAt: new Date().toISOString() };
}

function mapWaveform(project: Project, id: ID, fn: (w: Waveform) => Waveform): Project {
  return touch({
    ...project,
    waveforms: project.waveforms.map((w) => (w.id === id ? fn(w) : w)),
  });
}

function mapTrack(project: Project, waveformId: ID, trackId: ID, fn: (t: Track) => Track): Project {
  return mapWaveform(project, waveformId, (w) => ({
    ...w,
    tracks: w.tracks.map((t) => (t.id === trackId ? fn(t) : t)),
  }));
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: createEmptyProject(),
  past: [],
  future: [],
  dragSnapshot: null,
  selection: { waveformId: null, trackId: null, noteIds: [] },

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        project: previous,
        past: s.past.slice(0, -1),
        future: [s.project, ...s.future].slice(0, 100),
      };
    }),
  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        project: next,
        past: [...s.past, s.project].slice(-100),
        future: s.future.slice(1),
      };
    }),

  beginInteraction: () => set((s) => ({ dragSnapshot: s.project })),
  commitInteraction: () =>
    set((s) => {
      if (!s.dragSnapshot) return s;
      if (s.dragSnapshot === s.project) return { dragSnapshot: null };
      return { ...pushHistory({ past: s.past, future: s.future }, s.dragSnapshot), dragSnapshot: null };
    }),
  cancelInteraction: () =>
    set((s) => (s.dragSnapshot ? { project: s.dragSnapshot, dragSnapshot: null } : s)),

  newProject: (name) =>
    set((s) => ({
      project: createEmptyProject(name),
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      selection: { waveformId: null, trackId: null, noteIds: [] },
    })),

  loadProject: (project) =>
    set((s) => ({
      project,
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      selection: { waveformId: null, trackId: null, noteIds: [] },
    })),

  renameProject: (name) => set((s) => ({ project: touch({ ...s.project, name }) })),
  setMasterVolume: (v) => set((s) => ({ project: touch({ ...s.project, masterVolume: v }) })),
  setSwing: (v) => set((s) => ({ project: touch({ ...s.project, swing: v }) })),

  addTempoMarker: (marker) =>
    set((s) => {
      const next = pushHistory({ past: s.past, future: s.future }, s.project);
      const tempoMap = [...s.project.tempoMap.filter((m) => m.beat !== marker.beat), marker].sort(
        (a, b) => a.beat - b.beat,
      );
      return { ...next, project: touch({ ...s.project, tempoMap }) };
    }),
  updateTempoMarker: (beat, patch) =>
    set((s) => {
      const next = pushHistory({ past: s.past, future: s.future }, s.project);
      const tempoMap = s.project.tempoMap.map((m) => (m.beat === beat ? { ...m, ...patch } : m));
      return { ...next, project: touch({ ...s.project, tempoMap }) };
    }),
  removeTempoMarker: (beat) =>
    set((s) => {
      if (beat === 0) return s;
      const next = pushHistory({ past: s.past, future: s.future }, s.project);
      const tempoMap = s.project.tempoMap.filter((m) => m.beat !== beat);
      return { ...next, project: touch({ ...s.project, tempoMap }) };
    }),

  addTimeSignatureMarker: (marker) =>
    set((s) => {
      const next = pushHistory({ past: s.past, future: s.future }, s.project);
      const timeSignatureMap = [
        ...s.project.timeSignatureMap.filter((m) => m.beat !== marker.beat),
        marker,
      ].sort((a, b) => a.beat - b.beat);
      return { ...next, project: touch({ ...s.project, timeSignatureMap }) };
    }),
  removeTimeSignatureMarker: (beat) =>
    set((s) => {
      if (beat === 0) return s;
      const next = pushHistory({ past: s.past, future: s.future }, s.project);
      const timeSignatureMap = s.project.timeSignatureMap.filter((m) => m.beat !== beat);
      return { ...next, project: touch({ ...s.project, timeSignatureMap }) };
    }),

  setProjectMeta: (meta) =>
    set((s) => ({ project: touch({ ...s.project, meta: { ...s.project.meta, ...meta } }) })),

  addWaveformObject: (waveform) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: touch({ ...s.project, waveforms: [...s.project.waveforms, waveform] }),
    })),

  addWaveform: (name) => {
    const w = createWaveform({ name: name ?? `Waveform ${get().project.waveforms.length + 1}` });
    get().addWaveformObject(w);
    return w.id;
  },

  removeWaveform: (id) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: touch({ ...s.project, waveforms: s.project.waveforms.filter((w) => w.id !== id) }),
    })),

  renameWaveform: (id, name) => set((s) => ({ project: mapWaveform(s.project, id, (w) => ({ ...w, name })) })),

  setWaveformOffsetTransient: (id, offset) =>
    set((s) => ({ project: mapWaveform(s.project, id, (w) => ({ ...w, startOffset: offset })) })),

  setWaveformMuted: (id, muted) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapWaveform(s.project, id, (w) => ({ ...w, muted })),
    })),

  toggleWaveformCollapsed: (id) =>
    set((s) => ({ project: mapWaveform(s.project, id, (w) => ({ ...w, collapsed: !w.collapsed })) })),

  duplicateWaveform: (id) =>
    set((s) => {
      const source = s.project.waveforms.find((w) => w.id === id);
      if (!source) return s;
      const clone: Waveform = {
        ...source,
        id: makeId('wave'),
        name: `${source.name} copy`,
        tracks: source.tracks.map((t) => ({
          ...t,
          id: makeId('track'),
          notes: t.notes.map((n) => ({ ...n, id: makeId('note') })),
          effects: t.effects.map((e) => ({ ...e, id: makeId('fx') })),
        })),
      };
      return {
        ...pushHistory({ past: s.past, future: s.future }, s.project),
        project: touch({ ...s.project, waveforms: [...s.project.waveforms, clone] }),
      };
    }),

  confirmWaveformTiming: (id, confirmed) =>
    set((s) => ({
      project: mapWaveform(s.project, id, (w) =>
        w.importInfo ? { ...w, importInfo: { ...w.importInfo, timingConfirmed: confirmed } } : w,
      ),
    })),

  addTrack: (waveformId, track) => {
    const t = createTrack(track);
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapWaveform(s.project, waveformId, (w) => ({ ...w, tracks: [...w.tracks, t] })),
    }));
    return t.id;
  },

  removeTrack: (waveformId, trackId) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapWaveform(s.project, waveformId, (w) => ({
        ...w,
        tracks: w.tracks.filter((t) => t.id !== trackId),
      })),
    })),

  updateTrack: (waveformId, trackId, patch) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({ ...t, ...patch })),
    })),

  addEffect: (waveformId, trackId, type) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        effects: [...t.effects, createEffect(type)],
      })),
    })),

  removeEffect: (waveformId, trackId, effectId) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        effects: t.effects.filter((e) => e.id !== effectId),
      })),
    })),

  updateEffect: (waveformId, trackId, effectId, patch) =>
    set((s) => ({
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        effects: t.effects.map((e) => (e.id === effectId ? { ...e, ...patch, params: { ...e.params, ...patch.params } } : e)),
      })),
    })),

  addNote: (waveformId, trackId, note) => {
    const n = createNote(note);
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({ ...t, notes: [...t.notes, n] })),
    }));
    return n.id;
  },

  updateNote: (waveformId, trackId, noteId, patch) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      })),
    })),

  updateNoteTransient: (waveformId, trackId, noteId, patch) =>
    set((s) => ({
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      })),
    })),

  removeNotes: (waveformId, trackId, noteIds) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.filter((n) => !noteIds.includes(n.id)),
      })),
      selection: { ...s.selection, noteIds: s.selection.noteIds.filter((id) => !noteIds.includes(id)) },
    })),

  moveNotesTransient: (waveformId, trackId, noteIds, deltaPitch, deltaBeat) =>
    set((s) => ({
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.map((n) =>
          noteIds.includes(n.id)
            ? { ...n, pitch: clampPitch(n.pitch + deltaPitch), start: Math.max(0, n.start + deltaBeat) }
            : n,
        ),
      })),
    })),

  setNotePositionsTransient: (waveformId, trackId, updates) =>
    set((s) => {
      const byId = new Map(updates.map((u) => [u.id, u]));
      return {
        project: mapTrack(s.project, waveformId, trackId, (t) => ({
          ...t,
          notes: t.notes.map((n) => {
            const u = byId.get(n.id);
            return u ? { ...n, start: Math.max(0, u.start), pitch: clampPitch(u.pitch) } : n;
          }),
        })),
      };
    }),

  quantizeNotes: (waveformId, trackId, noteIds, gridBeats) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.map((n) =>
          noteIds.includes(n.id) && !n.locked ? { ...n, start: snapBeat(n.start, gridBeats) } : n,
        ),
      })),
    })),

  transposeNotes: (waveformId, trackId, noteIds, semitones) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({
        ...t,
        notes: t.notes.map((n) => (noteIds.includes(n.id) ? { ...n, pitch: clampPitch(n.pitch + semitones) } : n)),
      })),
    })),

  insertNotes: (waveformId, trackId, notes) =>
    set((s) => ({
      ...pushHistory({ past: s.past, future: s.future }, s.project),
      project: mapTrack(s.project, waveformId, trackId, (t) => ({ ...t, notes: [...t.notes, ...notes] })),
    })),

  setActiveTrack: (waveformId, trackId) =>
    set(() => ({ selection: { waveformId, trackId, noteIds: [] } })),

  selectNotes: (ids, additive) =>
    set((s) => ({
      selection: {
        ...s.selection,
        noteIds: additive ? Array.from(new Set([...s.selection.noteIds, ...ids])) : ids,
      },
    })),

  toggleNoteSelection: (id) =>
    set((s) => ({
      selection: {
        ...s.selection,
        noteIds: s.selection.noteIds.includes(id)
          ? s.selection.noteIds.filter((n) => n !== id)
          : [...s.selection.noteIds, id],
      },
    })),

  clearSelection: () => set((s) => ({ selection: { ...s.selection, noteIds: [] } })),
}));

function clampPitch(p: number): number {
  return Math.max(0, Math.min(127, p));
}
