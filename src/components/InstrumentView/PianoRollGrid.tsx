import { useRef, useState } from 'react';
import type { Note, Track, TimeSignatureMarker } from '@/state/types';
import { useProjectStore } from '@/state/projectStore';
import type { PointerTool } from '@/state/uiStore';
import { snapBeat } from '@/utils/time';
import { GridBackground } from './GridBackground';
import { NoteBlock, type NoteInteractionKind } from './NoteBlock';
import { NOTE_ROW_HEIGHT, visiblePitches, rowIndexForPitch, pitchForRowIndex } from './pianoRollConstants';

interface PianoRollGridProps {
  waveformId: string;
  track: Track;
  pxPerBeat: number;
  snapBeats: number;
  tool: PointerTool;
  defaultDuration: number;
  widthBeats: number;
  timeSignatureMap: TimeSignatureMarker[];
  selectedIds: string[];
  onPreviewPitch: (pitch: number) => void;
}

type DragState =
  | { kind: 'move'; noteIds: string[]; startX: number; startY: number; orig: Map<string, { start: number; pitch: number }> }
  | { kind: 'resize-left' | 'resize-right'; noteId: string; startX: number; origStart: number; origDuration: number }
  | { kind: 'marquee'; startX: number; startY: number; curX: number; curY: number; baseSelection: string[] }
  | { kind: 'create'; start: number; pitch: number; duration: number };

export function PianoRollGrid({
  waveformId,
  track,
  pxPerBeat,
  snapBeats,
  tool,
  defaultDuration,
  widthBeats,
  timeSignatureMap,
  selectedIds,
  onPreviewPitch,
}: PianoRollGridProps) {
  const addNote = useProjectStore((s) => s.addNote);
  const removeNotes = useProjectStore((s) => s.removeNotes);
  const selectNotes = useProjectStore((s) => s.selectNotes);
  const updateNoteTransient = useProjectStore((s) => s.updateNoteTransient);
  const setNotePositionsTransient = useProjectStore((s) => s.setNotePositionsTransient);
  const beginInteraction = useProjectStore((s) => s.beginInteraction);
  const commitInteraction = useProjectStore((s) => s.commitInteraction);
  const cancelInteraction = useProjectStore((s) => s.cancelInteraction);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  const pitches = visiblePitches(track.instrument.isDrumKit);
  const minDur = snapBeats > 0 ? snapBeats : 0.125;

  const beatAt = (clientX: number): number => {
    const rect = gridRef.current!.getBoundingClientRect();
    return Math.max(0, (clientX - rect.left) / pxPerBeat);
  };
  const rowAt = (clientY: number): number => {
    const rect = gridRef.current!.getBoundingClientRect();
    return Math.floor((clientY - rect.top) / NOTE_ROW_HEIGHT);
  };
  const snapped = (beat: number) => (snapBeats > 0 ? snapBeat(beat, snapBeats) : beat);

  const onNotePointerDown = (e: React.PointerEvent, note: Note, kind: NoteInteractionKind) => {
    if (tool === 'erase') {
      removeNotes(waveformId, track.id, [note.id]);
      return;
    }
    (e.target as Element).setPointerCapture(e.pointerId);
    beginInteraction();

    if (kind === 'move') {
      let ids: string[];
      if (selectedIds.includes(note.id)) {
        ids = selectedIds;
      } else if (e.shiftKey) {
        selectNotes([note.id], true);
        cancelInteraction();
        return;
      } else {
        selectNotes([note.id], false);
        ids = [note.id];
      }
      const orig = new Map<string, { start: number; pitch: number }>();
      const all = [note, ...track.notes.filter((n) => ids.includes(n.id) && n.id !== note.id)];
      for (const n of all) orig.set(n.id, { start: n.start, pitch: n.pitch });
      dragRef.current = { kind: 'move', noteIds: ids, startX: e.clientX, startY: e.clientY, orig };
    } else {
      if (!selectedIds.includes(note.id)) selectNotes([note.id], false);
      dragRef.current = { kind, noteId: note.id, startX: e.clientX, origStart: note.start, origDuration: note.duration };
    }
  };

  const onGridPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('.note-block')) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const beat = snapped(beatAt(e.clientX));
    const row = rowAt(e.clientY);
    const pitch = pitchForRowIndex(row, pitches);

    if (tool === 'erase') return;

    if (tool === 'select') {
      dragRef.current = {
        kind: 'marquee',
        startX: e.clientX,
        startY: e.clientY,
        curX: e.clientX,
        curY: e.clientY,
        baseSelection: e.shiftKey ? selectedIds : [],
      };
      rerender();
      return;
    }

    // draw tool: start creating a note
    beginInteraction();
    dragRef.current = { kind: 'create', start: beat, pitch, duration: minDur };
    rerender();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === 'move') {
      const rawDeltaBeat = (e.clientX - drag.startX) / pxPerBeat;
      const rawDeltaRow = Math.round((e.clientY - drag.startY) / NOTE_ROW_HEIGHT);
      const updates = drag.noteIds.map((id) => {
        const o = drag.orig.get(id)!;
        const newStartRaw = o.start + rawDeltaBeat;
        const newStart = snapBeats > 0 ? snapBeat(newStartRaw, snapBeats) : newStartRaw;
        const rowIdx = rowIndexForPitch(o.pitch, pitches) + rawDeltaRow;
        const newPitch = pitchForRowIndex(rowIdx, pitches);
        return { id, start: Math.max(0, newStart), pitch: newPitch };
      });
      setNotePositionsTransient(waveformId, track.id, updates);
    } else if (drag.kind === 'resize-right') {
      const rawDeltaBeat = (e.clientX - drag.startX) / pxPerBeat;
      const newDuration = Math.max(minDur, snapped(drag.origDuration + rawDeltaBeat));
      updateNoteTransient(waveformId, track.id, drag.noteId, { duration: newDuration });
    } else if (drag.kind === 'resize-left') {
      const rawDeltaBeat = (e.clientX - drag.startX) / pxPerBeat;
      let newStart = snapped(drag.origStart + rawDeltaBeat);
      newStart = Math.max(0, Math.min(newStart, drag.origStart + drag.origDuration - minDur));
      const newDuration = drag.origStart + drag.origDuration - newStart;
      updateNoteTransient(waveformId, track.id, drag.noteId, { start: newStart, duration: newDuration });
    } else if (drag.kind === 'marquee') {
      dragRef.current = { ...drag, curX: e.clientX, curY: e.clientY };
      const rect = gridRef.current!.getBoundingClientRect();
      const x1 = Math.min(drag.startX, e.clientX) - rect.left;
      const x2 = Math.max(drag.startX, e.clientX) - rect.left;
      const y1 = Math.min(drag.startY, e.clientY) - rect.top;
      const y2 = Math.max(drag.startY, e.clientY) - rect.top;
      const hits = track.notes.filter((n) => {
        const nx1 = n.start * pxPerBeat;
        const nx2 = nx1 + Math.max(4, n.duration * pxPerBeat);
        const rowIdx = rowIndexForPitch(n.pitch, pitches);
        const ny1 = rowIdx * NOTE_ROW_HEIGHT;
        const ny2 = ny1 + NOTE_ROW_HEIGHT;
        return nx1 < x2 && nx2 > x1 && ny1 < y2 && ny2 > y1;
      });
      selectNotes(Array.from(new Set([...drag.baseSelection, ...hits.map((n) => n.id)])), false);
      rerender();
    } else if (drag.kind === 'create') {
      const beat = beatAt(e.clientX);
      const duration = Math.max(minDur, snapped(beat - drag.start));
      dragRef.current = { ...drag, duration };
      rerender();
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind === 'create') {
      const id = addNote(waveformId, track.id, { pitch: drag.pitch, start: drag.start, duration: drag.duration, velocity: 100 });
      selectNotes([id], false);
      onPreviewPitch(drag.pitch);
    } else if (drag.kind === 'move' || drag.kind === 'resize-left' || drag.kind === 'resize-right') {
      commitInteraction();
    }
    dragRef.current = null;
    rerender();
  };

  const drag = dragRef.current;
  const width = widthBeats * pxPerBeat;
  const height = pitches.length * NOTE_ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="piano-roll-grid"
      style={{ position: 'relative', width, height }}
      onPointerDown={onGridPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div ref={gridRef} style={{ position: 'absolute', inset: 0 }}>
        <GridBackground
          widthBeats={widthBeats}
          pxPerBeat={pxPerBeat}
          pitches={pitches}
          isDrumKit={track.instrument.isDrumKit}
          snapBeats={snapBeats}
          timeSignatureMap={timeSignatureMap}
        />
        {track.notes.map((n) => (
          <NoteBlock
            key={n.id}
            note={n}
            rowIndex={rowIndexForPitch(n.pitch, pitches)}
            pxPerBeat={pxPerBeat}
            color={track.color}
            selected={selectedIds.includes(n.id)}
            onPointerDown={onNotePointerDown}
            onDoubleClick={(note) => removeNotes(waveformId, track.id, [note.id])}
          />
        ))}
        {drag?.kind === 'create' && (
          <div
            className="note-block draft"
            style={{
              position: 'absolute',
              left: drag.start * pxPerBeat,
              top: rowIndexForPitch(drag.pitch, pitches) * NOTE_ROW_HEIGHT + 1,
              width: Math.max(4, drag.duration * pxPerBeat),
              height: NOTE_ROW_HEIGHT - 2,
              background: track.color,
              opacity: 0.6,
              border: '1px dashed white',
            }}
          />
        )}
        {drag?.kind === 'marquee' && (
          <div
            className="marquee"
            style={{
              position: 'absolute',
              left: Math.min(drag.startX, drag.curX) - gridRef.current!.getBoundingClientRect().left,
              top: Math.min(drag.startY, drag.curY) - gridRef.current!.getBoundingClientRect().top,
              width: Math.abs(drag.curX - drag.startX),
              height: Math.abs(drag.curY - drag.startY),
              background: 'rgba(110,231,255,0.15)',
              border: '1px solid var(--accent)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
