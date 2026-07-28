import { useRef, useState } from 'react';
import type { Waveform } from '@/state/types';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { snapBeat } from '@/utils/time';
import { NoteDensityStrip } from './NoteDensityStrip';
import { TrackRow } from './TrackRow';
import './WaveformLane.css';

interface WaveformLaneProps {
  waveform: Waveform;
  pxPerBeat: number;
}

const LANE_HEIGHT = 64;

export function WaveformLane({ waveform, pxPerBeat }: WaveformLaneProps) {
  const renameWaveform = useProjectStore((s) => s.renameWaveform);
  const removeWaveform = useProjectStore((s) => s.removeWaveform);
  const duplicateWaveform = useProjectStore((s) => s.duplicateWaveform);
  const setWaveformMuted = useProjectStore((s) => s.setWaveformMuted);
  const toggleCollapsed = useProjectStore((s) => s.toggleWaveformCollapsed);
  const setOffsetTransient = useProjectStore((s) => s.setWaveformOffsetTransient);
  const beginInteraction = useProjectStore((s) => s.beginInteraction);
  const commitInteraction = useProjectStore((s) => s.commitInteraction);
  const confirmTiming = useProjectStore((s) => s.confirmWaveformTiming);

  const [editingName, setEditingName] = useState(false);

  const drag = useRef<{ startX: number; startOffset: number; moved: boolean } | null>(null);

  const allNotes = waveform.tracks.flatMap((t) => t.notes);
  const contentEndBeat = Math.max(4, ...allNotes.map((n) => n.start + n.duration), 0);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startOffset: waveform.startOffset, moved: false };
    beginInteraction();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const deltaPx = e.clientX - drag.current.startX;
    if (Math.abs(deltaPx) > 3) drag.current.moved = true;
    const deltaBeats = deltaPx / pxPerBeat;
    let next = Math.max(0, drag.current.startOffset + deltaBeats);
    if (!e.altKey) next = snapBeat(next, 1);
    setOffsetTransient(waveform.id, next);
  };
  const onPointerUp = () => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    commitInteraction();
    if (!wasDrag) toggleCollapsed(waveform.id);
  };

  return (
    <div className="waveform-lane">
      <div className="waveform-lane-row">
        <div className="waveform-sidebar" style={{ borderLeftColor: waveform.color }}>
          <button className="btn icon-only" onClick={() => toggleCollapsed(waveform.id)} title="Expand/collapse">
            {waveform.collapsed ? '▸' : '▾'}
          </button>
          {editingName ? (
            <input
              autoFocus
              defaultValue={waveform.name}
              onBlur={(e) => {
                renameWaveform(waveform.id, e.target.value || waveform.name);
                setEditingName(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          ) : (
            <span
              className="waveform-lane-name"
              onDoubleClick={() => setEditingName(true)}
              title={`${waveform.name} — ${waveform.tracks.length} track${waveform.tracks.length === 1 ? '' : 's'} (double-click to rename)`}
            >
              {waveform.name}
            </span>
          )}
          {waveform.importInfo && !waveform.importInfo.timingConfirmed && (
            <span className="waveform-unconfirmed" title="Imported timing wasn't confirmed — grid alignment may be approximate">
              ⚠ timing unconfirmed
              <button className="btn icon-only" style={{ marginLeft: 4 }} onClick={() => confirmTiming(waveform.id, true)}>
                confirm
              </button>
            </span>
          )}
          <div className="waveform-sidebar-actions">
            <button className="btn icon-only" title={waveform.muted ? 'Unmute' : 'Mute'} onClick={() => setWaveformMuted(waveform.id, !waveform.muted)}>
              {waveform.muted ? '🔇' : '🔊'}
            </button>
            <button className="btn icon-only" title="Duplicate" onClick={() => duplicateWaveform(waveform.id)}>
              ⧉
            </button>
            <button className="btn danger icon-only" title="Delete waveform" onClick={() => removeWaveform(waveform.id)}>
              ✕
            </button>
          </div>
        </div>
        <div className="waveform-timeline" style={{ height: LANE_HEIGHT }}>
          <div
            className="waveform-block"
            style={{
              left: waveform.startOffset * pxPerBeat,
              width: contentEndBeat * pxPerBeat,
              background: waveform.color + '33',
              borderColor: waveform.color,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <NoteDensityStrip notes={allNotes} widthPx={contentEndBeat * pxPerBeat} heightPx={LANE_HEIGHT - 8} pxPerBeat={pxPerBeat} color={waveform.color} />
          </div>
        </div>
      </div>
      {!waveform.collapsed && (
        <div className="waveform-tracks">
          {waveform.tracks.length === 0 && <div className="waveform-tracks-empty">No instrument tracks yet.</div>}
          {waveform.tracks.map((t) => (
            <TrackRow key={t.id} waveformId={waveform.id} track={t} />
          ))}
        </div>
      )}
    </div>
  );
}
