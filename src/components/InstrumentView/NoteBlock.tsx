import type { Note } from '@/state/types';
import { NOTE_ROW_HEIGHT } from './pianoRollConstants';

export type NoteInteractionKind = 'move' | 'resize-left' | 'resize-right';

interface NoteBlockProps {
  note: Note;
  rowIndex: number;
  pxPerBeat: number;
  color: string;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, note: Note, kind: NoteInteractionKind) => void;
  onDoubleClick: (note: Note) => void;
}

const EDGE_PX = 7;

export function NoteBlock({ note, rowIndex, pxPerBeat, color, selected, onPointerDown, onDoubleClick }: NoteBlockProps) {
  const left = note.start * pxPerBeat;
  const width = Math.max(4, note.duration * pxPerBeat);
  const top = rowIndex * NOTE_ROW_HEIGHT;
  const opacity = 0.45 + (note.velocity / 127) * 0.55;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    let kind: NoteInteractionKind = 'move';
    if (offsetX <= EDGE_PX) kind = 'resize-left';
    else if (offsetX >= rect.width - EDGE_PX) kind = 'resize-right';
    onPointerDown(e, note, kind);
  };

  return (
    <div
      className={`note-block ${selected ? 'selected' : ''}`}
      style={{
        left,
        top: top + 1,
        width,
        height: NOTE_ROW_HEIGHT - 2,
        background: color,
        opacity,
        borderColor: selected ? 'var(--text-0)' : 'rgba(0,0,0,0.4)',
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(note);
      }}
      title={`vel ${note.velocity}`}
    >
      <div className="note-block-handle left" />
      <div className="note-block-handle right" />
    </div>
  );
}
