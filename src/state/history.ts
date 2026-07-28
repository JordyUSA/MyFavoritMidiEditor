import type { Project } from './types';

const MAX_HISTORY = 100;

export interface HistoryState {
  past: Project[];
  future: Project[];
}

export function pushHistory(history: HistoryState, snapshot: Project): HistoryState {
  const past = [...history.past, snapshot];
  if (past.length > MAX_HISTORY) past.shift();
  return { past, future: [] };
}
