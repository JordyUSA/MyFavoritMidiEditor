/** A friendly, high-contrast palette cycled for new waveforms and tracks. */
export const PALETTE: string[] = [
  '#6ee7ff', '#ff9f6e', '#c6ff6e', '#ff6ec7', '#a06eff', '#ffe66e',
  '#6effb0', '#ff6e6e', '#6e9fff', '#ff6ea0', '#6effe6', '#d6ff6e',
];

let cursor = 0;
export function nextColor(): string {
  const c = PALETTE[cursor % PALETTE.length];
  cursor += 1;
  return c;
}

export function resetColorCursor(): void {
  cursor = 0;
}
