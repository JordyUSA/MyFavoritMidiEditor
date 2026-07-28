import { useMemo } from 'react';
import type { TimeSignatureMarker } from '@/state/types';
import { timeSignatureAtBeat } from '@/utils/time';
import './BeatRuler.css';

interface BeatRulerProps {
  totalBeats: number;
  pxPerBeat: number;
  timeSignatureMap: TimeSignatureMarker[];
  leftGutter?: number;
  height?: number;
  onScrub?: (beat: number) => void;
}

interface BarMark {
  beat: number;
  barNumber: number;
}

export function BeatRuler({ totalBeats, pxPerBeat, timeSignatureMap, leftGutter = 0, height = 28, onScrub }: BeatRulerProps) {
  const bars = useMemo<BarMark[]>(() => {
    const marks: BarMark[] = [];
    let beat = 0;
    let barNumber = 1;
    let guard = 0;
    while (beat < totalBeats + 8 && guard < 5000) {
      guard += 1;
      const sig = timeSignatureAtBeat(beat, timeSignatureMap);
      const barBeats = sig.numerator * (4 / sig.denominator);
      marks.push({ beat, barNumber });
      beat += barBeats;
      barNumber += 1;
    }
    return marks;
  }, [totalBeats, timeSignatureMap]);

  return (
    <div
      className="beat-ruler"
      style={{ height, paddingLeft: leftGutter, width: totalBeats * pxPerBeat + leftGutter }}
      onMouseDown={(e) => {
        if (!onScrub) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const beat = (e.clientX - rect.left - leftGutter) / pxPerBeat;
        onScrub(Math.max(0, beat));
      }}
    >
      {bars.map((m) => (
        <div key={m.beat} className="beat-ruler-bar" style={{ left: leftGutter + m.beat * pxPerBeat }}>
          <span>{m.barNumber}</span>
        </div>
      ))}
    </div>
  );
}
