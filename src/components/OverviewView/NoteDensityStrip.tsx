import { useEffect, useRef } from 'react';

interface StripNote {
  start: number;
  duration: number;
  velocity: number;
}

interface NoteDensityStripProps {
  notes: StripNote[];
  widthPx: number;
  heightPx: number;
  pxPerBeat: number;
  color: string;
}

/**
 * A stand-in "waveform": since these are MIDI notes rather than recorded
 * audio, there's no literal amplitude to draw. Instead this renders a
 * note-density/velocity silhouette (mirrored top & bottom, like a classic
 * audio waveform) so a Waveform lane still reads at a glance in the
 * zoomed-out overview.
 */
export function NoteDensityStrip({ notes, widthPx, heightPx, pxPerBeat, color }: NoteDensityStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.ceil(widthPx));
    canvas.width = w * dpr;
    canvas.height = heightPx * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${heightPx}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, heightPx);

    const buckets = new Float32Array(w);
    for (const n of notes) {
      const startPx = Math.max(0, Math.floor(n.start * pxPerBeat));
      const endPx = Math.min(w, Math.ceil((n.start + n.duration) * pxPerBeat));
      const amp = Math.min(1, n.velocity / 127);
      for (let x = startPx; x < endPx; x++) {
        buckets[x] = Math.min(1, buckets[x] + amp * 0.6);
      }
    }

    ctx.fillStyle = color;
    const mid = heightPx / 2;
    for (let x = 0; x < w; x++) {
      const amp = buckets[x];
      if (amp <= 0) continue;
      const h = Math.max(1, amp * mid);
      ctx.fillRect(x, mid - h, 1, h * 2);
    }
  }, [notes, widthPx, heightPx, pxPerBeat, color]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}
