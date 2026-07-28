interface PlayheadProps {
  beat: number;
  pxPerBeat: number;
  leftGutter?: number;
  height?: number | string;
}

export function Playhead({ beat, pxPerBeat, leftGutter = 0, height = '100%' }: PlayheadProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: leftGutter + beat * pxPerBeat,
        width: 2,
        height,
        background: 'var(--accent-warn)',
        boxShadow: '0 0 6px rgba(255,184,110,0.7)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
