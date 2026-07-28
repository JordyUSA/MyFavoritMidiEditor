import { useRef } from 'react';
import type { Track } from '@/state/types';
import { useProjectStore } from '@/state/projectStore';
import './VelocityLane.css';

interface VelocityLaneProps {
  waveformId: string;
  track: Track;
  pxPerBeat: number;
  selectedIds: string[];
  height?: number;
}

export function VelocityLane({ waveformId, track, pxPerBeat, selectedIds, height = 72 }: VelocityLaneProps) {
  const updateNoteTransient = useProjectStore((s) => s.updateNoteTransient);
  const beginInteraction = useProjectStore((s) => s.beginInteraction);
  const commitInteraction = useProjectStore((s) => s.commitInteraction);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIds = useRef<string[] | null>(null);

  const velocityFromY = (clientY: number): number => {
    const rect = containerRef.current!.getBoundingClientRect();
    const ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return Math.max(1, Math.round(ratio * 127));
  };

  const applyVelocity = (noteId: string, velocity: number) => {
    const ids = selectedIds.includes(noteId) && selectedIds.length > 1 ? selectedIds : [noteId];
    draggingIds.current = ids;
    for (const id of ids) updateNoteTransient(waveformId, track.id, id, { velocity });
  };

  return (
    <div
      ref={containerRef}
      className="velocity-lane"
      style={{ width: Math.max(200, ...track.notes.map((n) => (n.start + n.duration) * pxPerBeat)), height }}
      onPointerMove={(e) => {
        if (draggingIds.current) {
          const v = velocityFromY(e.clientY);
          for (const id of draggingIds.current) updateNoteTransient(waveformId, track.id, id, { velocity: v });
        }
      }}
      onPointerUp={() => {
        if (draggingIds.current) commitInteraction();
        draggingIds.current = null;
      }}
      onPointerLeave={() => {
        if (draggingIds.current) commitInteraction();
        draggingIds.current = null;
      }}
    >
      {track.notes.map((n) => (
        <div
          key={n.id}
          className={`velocity-bar ${selectedIds.includes(n.id) ? 'selected' : ''}`}
          style={{
            left: n.start * pxPerBeat,
            height: (n.velocity / 127) * height,
            background: track.color,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.target as Element).setPointerCapture(e.pointerId);
            beginInteraction();
            applyVelocity(n.id, velocityFromY(e.clientY));
          }}
        />
      ))}
    </div>
  );
}
