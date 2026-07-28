import type { ReactNode } from 'react';

export type IconName =
  | 'play'
  | 'pause'
  | 'stop'
  | 'loop'
  | 'metronome'
  | 'volume'
  | 'mute'
  | 'solo'
  | 'chevronDown'
  | 'chevronRight'
  | 'trash'
  | 'duplicate'
  | 'pencil'
  | 'cursor'
  | 'eraser'
  | 'piano'
  | 'drum'
  | 'plus'
  | 'close'
  | 'headphones'
  | 'bolt'
  | 'sliders'
  | 'undo'
  | 'redo'
  | 'musicNote';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** A small, consistent stroke-icon set (Feather-style) used in place of emoji for primary controls. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const ICON_PATHS: Record<IconName, ReactNode> = {
  play: <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor" stroke="none" />,
  loop: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  metronome: (
    <>
      <path d="M8 21h8" />
      <path d="M10.5 3h3l4 18h-11z" />
      <path d="M9.5 15h5" />
      <path d="M12 3v6l4 5" />
    </>
  ),
  volume: (
    <>
      <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  mute: (
    <>
      <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" fill="currentColor" stroke="none" />
      <path d="M17 9l5 6" />
      <path d="M22 9l-5 6" />
    </>
  ),
  solo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="700">
        S
      </text>
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  duplicate: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="1.5" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  cursor: <path d="M4 3l7 17 2.5-7.5L21 10z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />,
  eraser: (
    <>
      <path d="M18 13l-7.5 7.5a2 2 0 0 1-2.8 0L3 15.8a2 2 0 0 1 0-2.8L13 3a2 2 0 0 1 2.8 0L21 8.2a2 2 0 0 1 0 2.8z" />
      <path d="M8 20h13" />
    </>
  ),
  piano: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M7 4v10" />
      <path d="M11 4v10" />
      <path d="M15 4v10" />
      <path d="M3 14h18" />
    </>
  ),
  drum: (
    <>
      <ellipse cx="12" cy="7" rx="8" ry="4" />
      <path d="M4 7v9c0 2.2 3.6 4 8 4s8-1.8 8-4V7" />
      <path d="M6.5 5L3 2" />
      <path d="M17.5 5L21 2" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  headphones: <path d="M3 18v-6a9 9 0 0 1 18 0v6" />,
  bolt: <polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" fill="currentColor" stroke="none" />,
  sliders: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="var(--bg-2)" />
      <circle cx="16" cy="12" r="2" fill="var(--bg-2)" />
      <circle cx="10" cy="18" r="2" fill="var(--bg-2)" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
    </>
  ),
  redo: (
    <>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h1" />
    </>
  ),
  musicNote: (
    <>
      <circle cx="7" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M10 18V4l11-2v12" />
    </>
  ),
};
