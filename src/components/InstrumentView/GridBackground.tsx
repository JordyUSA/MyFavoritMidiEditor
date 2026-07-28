import { useEffect, useRef } from 'react';
import type { TimeSignatureMarker } from '@/state/types';
import { timeSignatureAtBeat } from '@/utils/time';
import { NOTE_ROW_HEIGHT, isBlackKey } from './pianoRollConstants';

interface GridBackgroundProps {
  widthBeats: number;
  pxPerBeat: number;
  pitches: number[];
  isDrumKit: boolean;
  snapBeats: number;
  timeSignatureMap: TimeSignatureMarker[];
}

export function GridBackground({ widthBeats, pxPerBeat, pitches, isDrumKit, snapBeats, timeSignatureMap }: GridBackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const width = widthBeats * pxPerBeat;
  const height = pitches.length * NOTE_ROW_HEIGHT;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, width) * dpr;
    canvas.height = Math.max(1, height) * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Row shading
    pitches.forEach((p, i) => {
      const y = i * NOTE_ROW_HEIGHT;
      const shaded = isDrumKit ? i % 2 === 0 : isBlackKey(p);
      ctx.fillStyle = shaded ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0)';
      ctx.fillRect(0, y, width, NOTE_ROW_HEIGHT);
    });

    // Vertical grid: subdivisions, beats, bars
    if (snapBeats > 0) {
      ctx.beginPath();
      for (let b = 0; b * snapBeats <= widthBeats; b++) {
        const x = Math.round(b * snapBeats * pxPerBeat) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.stroke();
    }

    ctx.beginPath();
    for (let b = 0; b <= widthBeats; b++) {
      const x = Math.round(b * pxPerBeat) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.stroke();

    ctx.beginPath();
    let beat = 0;
    let guard = 0;
    while (beat < widthBeats && guard < 2000) {
      guard += 1;
      const sig = timeSignatureAtBeat(beat, timeSignatureMap);
      const barBeats = sig.numerator * (4 / sig.denominator);
      const x = Math.round(beat * pxPerBeat) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      beat += barBeats;
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.stroke();
  }, [width, height, pitches, isDrumKit, snapBeats, pxPerBeat, widthBeats, timeSignatureMap]);

  return <canvas ref={ref} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />;
}
