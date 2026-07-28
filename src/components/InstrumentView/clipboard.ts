import type { Note } from '@/state/types';

/** Module-level so copy/paste works across track switches within the session. */
let clipboard: Omit<Note, 'id'>[] = [];

export function copyNotes(notes: Note[]): void {
  if (notes.length === 0) return;
  const minStart = Math.min(...notes.map((n) => n.start));
  clipboard = notes.map((n) => ({ ...n, start: n.start - minStart }));
}

export function pasteNotes(atBeat: number): Omit<Note, 'id'>[] {
  return clipboard.map((n) => ({ ...n, start: atBeat + n.start }));
}

export function hasClipboard(): boolean {
  return clipboard.length > 0;
}
