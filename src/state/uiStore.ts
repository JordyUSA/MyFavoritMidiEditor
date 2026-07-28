import { create } from 'zustand';
import type { MidiImportResult } from '@/midi/import';

export type ViewMode = 'overview' | 'instrument';
export type PointerTool = 'draw' | 'select' | 'erase';

interface UiState {
  view: ViewMode;
  setView: (v: ViewMode) => void;

  activeWaveformId: string | null;
  activeTrackId: string | null;
  openInstrumentView: (waveformId: string, trackId: string) => void;

  overviewPxPerBeat: number;
  instrumentPxPerBeat: number;
  setOverviewZoom: (px: number) => void;
  setInstrumentZoom: (px: number) => void;

  snapBeats: number;
  setSnap: (beats: number) => void;

  tool: PointerTool;
  setTool: (t: PointerTool) => void;

  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  isLoadingAudio: boolean;
  setIsLoadingAudio: (loading: boolean) => void;
  playheadBeat: number;
  setPlayheadBeat: (b: number) => void;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;
  metronomeEnabled: boolean;
  setMetronome: (e: boolean) => void;

  activePanel: 'none' | 'effects' | 'presetsBeats' | 'presetsSongs' | 'importConfirm' | 'save' | 'export' | 'mixer';
  setActivePanel: (p: UiState['activePanel']) => void;

  effectsTarget: { waveformId: string; trackId: string } | null;
  openEffectsFor: (waveformId: string, trackId: string) => void;

  defaultNoteDuration: number;
  setDefaultNoteDuration: (beats: number) => void;

  pendingImports: MidiImportResult[];
  queueImports: (imports: MidiImportResult[]) => void;
  dequeueImport: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  view: 'overview',
  setView: (v) => set({ view: v }),

  activeWaveformId: null,
  activeTrackId: null,
  openInstrumentView: (waveformId, trackId) =>
    set({ view: 'instrument', activeWaveformId: waveformId, activeTrackId: trackId }),

  overviewPxPerBeat: 12,
  instrumentPxPerBeat: 40,
  setOverviewZoom: (px) => set({ overviewPxPerBeat: Math.max(2, Math.min(80, px)) }),
  setInstrumentZoom: (px) => set({ instrumentPxPerBeat: Math.max(10, Math.min(240, px)) }),

  snapBeats: 0.25,
  setSnap: (beats) => set({ snapBeats: beats }),

  tool: 'draw',
  setTool: (t) => set({ tool: t }),

  isPlaying: false,
  setIsPlaying: (p) => set({ isPlaying: p }),
  isLoadingAudio: false,
  setIsLoadingAudio: (loading) => set({ isLoadingAudio: loading }),
  playheadBeat: 0,
  setPlayheadBeat: (b) => set({ playheadBeat: b }),
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 16,
  setLoop: (enabled, start, end) =>
    set((s) => ({
      loopEnabled: enabled,
      loopStart: start ?? s.loopStart,
      loopEnd: end ?? s.loopEnd,
    })),
  metronomeEnabled: false,
  setMetronome: (e) => set({ metronomeEnabled: e }),

  activePanel: 'none',
  setActivePanel: (p) => set({ activePanel: p }),

  effectsTarget: null,
  openEffectsFor: (waveformId, trackId) => set({ effectsTarget: { waveformId, trackId }, activePanel: 'effects' }),

  defaultNoteDuration: 1,
  setDefaultNoteDuration: (beats) => set({ defaultNoteDuration: beats }),

  pendingImports: [],
  queueImports: (imports) =>
    set((s) => ({
      pendingImports: [...s.pendingImports, ...imports],
      activePanel: s.pendingImports.length === 0 && imports.length > 0 ? 'importConfirm' : s.activePanel,
    })),
  dequeueImport: () =>
    set((s) => {
      const rest = s.pendingImports.slice(1);
      return { pendingImports: rest, activePanel: rest.length > 0 ? 'importConfirm' : 'none' };
    }),
}));
