import { useEffect, useMemo, Suspense, lazy } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { SNAP_OPTIONS, beatsPerBar, timeSignatureAtBeat } from '@/utils/time';
import { BeatRuler } from '@/components/common/BeatRuler';
import { Playhead } from '@/components/common/Playhead';
import { usePreviewInstrument } from '@/audio/usePreviewInstrument';
import { PianoKeys } from './PianoKeys';
import { PianoRollGrid } from './PianoRollGrid';
import { VelocityLane } from './VelocityLane';
import { InstrumentPicker } from './InstrumentPicker';
import { KEYS_WIDTH } from './pianoRollConstants';
import { copyNotes, pasteNotes, hasClipboard } from './clipboard';
import { createInstrument as createFallbackSpec } from '@/state/factories';
import './PianoRoll.css';
import './InstrumentView.css';

const FALLBACK_INSTRUMENT = createFallbackSpec(0, false);
const NotationView = lazy(() => import('./NotationView').then((m) => ({ default: m.NotationView })));

export function InstrumentView() {
  const project = useProjectStore((s) => s.project);
  const activeWaveformId = useUiStore((s) => s.activeWaveformId);
  const activeTrackId = useUiStore((s) => s.activeTrackId);
  const setView = useUiStore((s) => s.setView);

  const waveform = project.waveforms.find((w) => w.id === activeWaveformId);
  const track = waveform?.tracks.find((t) => t.id === activeTrackId);

  const updateTrack = useProjectStore((s) => s.updateTrack);
  const removeNotes = useProjectStore((s) => s.removeNotes);
  const insertNotes = useProjectStore((s) => s.insertNotes);
  const selectNotes = useProjectStore((s) => s.selectNotes);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const quantizeNotes = useProjectStore((s) => s.quantizeNotes);
  const transposeNotes = useProjectStore((s) => s.transposeNotes);
  const moveNotesTransient = useProjectStore((s) => s.moveNotesTransient);
  const beginInteraction = useProjectStore((s) => s.beginInteraction);
  const commitInteraction = useProjectStore((s) => s.commitInteraction);
  const selection = useProjectStore((s) => s.selection);

  const pxPerBeat = useUiStore((s) => s.instrumentPxPerBeat);
  const setZoom = useUiStore((s) => s.setInstrumentZoom);
  const snapBeats = useUiStore((s) => s.snapBeats);
  const setSnap = useUiStore((s) => s.setSnap);
  const tool = useUiStore((s) => s.tool);
  const setTool = useUiStore((s) => s.setTool);
  const playheadBeat = useUiStore((s) => s.playheadBeat);
  const setPlayheadBeat = useUiStore((s) => s.setPlayheadBeat);
  const isPlaying = useUiStore((s) => s.isPlaying);
  const defaultNoteDuration = useUiStore((s) => s.defaultNoteDuration);
  const setDefaultNoteDuration = useUiStore((s) => s.setDefaultNoteDuration);

  const preview = usePreviewInstrument(track?.instrument ?? FALLBACK_INSTRUMENT);

  const selectedIds = useMemo(
    () => (track ? selection.noteIds.filter((id) => track.notes.some((n) => n.id === id)) : []),
    [track, selection.noteIds],
  );

  const widthBeats = useMemo(() => {
    if (!track) return 64;
    return Math.max(32, ...track.notes.map((n) => n.start + n.duration + 8));
  }, [track]);

  useEffect(() => {
    if (activeWaveformId && activeTrackId && !track) {
      setView('overview');
    }
  }, [activeWaveformId, activeTrackId, track, setView]);

  useEffect(() => {
    if (!track || !waveform) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        removeNotes(waveform.id, track.id, selectedIds);
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectNotes(track.notes.map((n) => n.id), false);
      } else if (mod && e.key.toLowerCase() === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        copyNotes(track.notes.filter((n) => selectedIds.includes(n.id)));
      } else if (mod && e.key.toLowerCase() === 'v' && hasClipboard()) {
        e.preventDefault();
        const pasted = pasteNotes(playheadBeat);
        insertNotes(waveform.id, track.id, pasted.map((n, i) => ({ ...n, id: `note_paste_${Date.now()}_${i}` })));
      } else if (mod && e.key.toLowerCase() === 'q' && selectedIds.length > 0) {
        e.preventDefault();
        quantizeNotes(waveform.id, track.id, selectedIds, snapBeats || 0.25);
      } else if (e.key === 'ArrowUp' && selectedIds.length > 0) {
        e.preventDefault();
        transposeNotes(waveform.id, track.id, selectedIds, e.shiftKey ? 12 : 1);
      } else if (e.key === 'ArrowDown' && selectedIds.length > 0) {
        e.preventDefault();
        transposeNotes(waveform.id, track.id, selectedIds, e.shiftKey ? -12 : -1);
      } else if (e.key === 'ArrowLeft' && selectedIds.length > 0) {
        e.preventDefault();
        beginInteraction();
        moveNotesTransient(waveform.id, track.id, selectedIds, 0, -(snapBeats || 0.25));
        commitInteraction();
      } else if (e.key === 'ArrowRight' && selectedIds.length > 0) {
        e.preventDefault();
        beginInteraction();
        moveNotesTransient(waveform.id, track.id, selectedIds, 0, snapBeats || 0.25);
        commitInteraction();
      } else if (e.code === 'Space') {
        e.preventDefault();
        useUiStore.getState().setIsPlaying(!useUiStore.getState().isPlaying);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    track,
    waveform,
    selectedIds,
    playheadBeat,
    snapBeats,
    removeNotes,
    clearSelection,
    selectNotes,
    insertNotes,
    quantizeNotes,
    transposeNotes,
    moveNotesTransient,
    beginInteraction,
    commitInteraction,
  ]);

  if (!track || !waveform) return null;

  const sig = timeSignatureAtBeat(0, project.timeSignatureMap);
  const barBeats = beatsPerBar(sig);

  return (
    <div className="instrument-view">
      <div className="instrument-toolbar">
        <button className="btn" onClick={() => setView('overview')}>
          ← Overview
        </button>
        <input
          className="track-name-input"
          value={track.name}
          onChange={(e) => updateTrack(waveform.id, track.id, { name: e.target.value })}
        />
        <InstrumentPicker
          instrument={track.instrument}
          onChange={(spec) => updateTrack(waveform.id, track.id, { instrument: spec, name: spec.name })}
        />
        <hr className="sep" />
        <div className="btn-group">
          <button className={`btn ${track.viewMode === 'bars' ? 'toggled' : ''}`} onClick={() => updateTrack(waveform.id, track.id, { viewMode: 'bars' })}>
            Bars
          </button>
          <button className={`btn ${track.viewMode === 'notation' ? 'toggled' : ''}`} onClick={() => updateTrack(waveform.id, track.id, { viewMode: 'notation' })}>
            Notation
          </button>
        </div>
        {track.viewMode === 'bars' && (
          <>
            <hr className="sep" />
            <div className="btn-group">
              <button className={`btn ${tool === 'draw' ? 'toggled' : ''}`} title="Draw (click/drag to add notes)" onClick={() => setTool('draw')}>
                ✏️ Draw
              </button>
              <button className={`btn ${tool === 'select' ? 'toggled' : ''}`} title="Select" onClick={() => setTool('select')}>
                ⬚ Select
              </button>
              <button className={`btn ${tool === 'erase' ? 'toggled' : ''}`} title="Erase" onClick={() => setTool('erase')}>
                🗑 Erase
              </button>
            </div>
            <hr className="sep" />
            <span className="field-label">Snap</span>
            <select value={snapBeats} onChange={(e) => setSnap(Number(e.target.value))}>
              {SNAP_OPTIONS.map((o) => (
                <option key={o.label} value={o.beats}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="field-label">Draw len</span>
            <select value={defaultNoteDuration} onChange={(e) => setDefaultNoteDuration(Number(e.target.value))}>
              <option value={1}>1/4</option>
              <option value={0.5}>1/8</option>
              <option value={0.25}>1/16</option>
              <option value={2}>1/2</option>
              <option value={4}>1/1</option>
            </select>
            {selectedIds.length > 0 && (
              <>
                <hr className="sep" />
                <button className="btn" onClick={() => quantizeNotes(waveform.id, track.id, selectedIds, snapBeats || 0.25)}>
                  Quantize
                </button>
                <button className="btn danger" onClick={() => removeNotes(waveform.id, track.id, selectedIds)}>
                  Delete ({selectedIds.length})
                </button>
              </>
            )}
          </>
        )}
        <div style={{ flex: 1 }} />
        <span className="field-label">Zoom</span>
        <input type="range" min={16} max={160} value={pxPerBeat} onChange={(e) => setZoom(Number(e.target.value))} />
      </div>

      {track.viewMode === 'bars' ? (
        <div className="instrument-scroll">
          <div className="instrument-content" style={{ position: 'relative' }}>
            <BeatRuler
              totalBeats={widthBeats}
              pxPerBeat={pxPerBeat}
              timeSignatureMap={project.timeSignatureMap}
              leftGutter={KEYS_WIDTH}
              onScrub={(beat) => !isPlaying && setPlayheadBeat(beat)}
            />
            <div style={{ display: 'flex' }}>
              <PianoKeys isDrumKit={track.instrument.isDrumKit} onPreview={(p) => preview?.(p)} />
              <PianoRollGrid
                waveformId={waveform.id}
                track={track}
                pxPerBeat={pxPerBeat}
                snapBeats={snapBeats}
                tool={tool}
                defaultDuration={defaultNoteDuration}
                widthBeats={widthBeats}
                timeSignatureMap={project.timeSignatureMap}
                selectedIds={selectedIds}
                onPreviewPitch={(p) => preview?.(p)}
              />
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ width: KEYS_WIDTH, flexShrink: 0, background: 'var(--bg-1)', borderRight: '1px solid var(--border)' }} />
              <VelocityLane waveformId={waveform.id} track={track} pxPerBeat={pxPerBeat} selectedIds={selectedIds} />
            </div>
            <Playhead beat={playheadBeat} pxPerBeat={pxPerBeat} leftGutter={KEYS_WIDTH} height="100%" />
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="notation-loading">Loading notation engine…</div>}>
          <NotationView waveformId={waveform.id} track={track} timeSignatureMap={project.timeSignatureMap} barBeats={barBeats} />
        </Suspense>
      )}
    </div>
  );
}
