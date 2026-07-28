import { midiToNoteName, GM_DRUM_NOTES } from '@/utils/gmInstruments';
import { NOTE_ROW_HEIGHT, KEYS_WIDTH, isBlackKey, visiblePitches } from './pianoRollConstants';
import './PianoKeys.css';

interface PianoKeysProps {
  isDrumKit: boolean;
  onPreview: (pitch: number) => void;
}

export function PianoKeys({ isDrumKit, onPreview }: PianoKeysProps) {
  const pitches = visiblePitches(isDrumKit);
  return (
    <div className="piano-keys" style={{ width: KEYS_WIDTH }}>
      {pitches.map((p) => {
        const drumInfo = isDrumKit ? GM_DRUM_NOTES.find((d) => d.pitch === p) : undefined;
        const black = !isDrumKit && isBlackKey(p);
        const noteName = midiToNoteName(p);
        const isC = !isDrumKit && noteName.startsWith('C') && !noteName.startsWith('C#');
        return (
          <div
            key={p}
            className={`piano-key ${black ? 'black' : 'white'}`}
            style={{ height: NOTE_ROW_HEIGHT }}
            onPointerDown={() => onPreview(p)}
          >
            {isDrumKit ? <span className="drum-label">{drumInfo?.name}</span> : isC ? <span>{noteName}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
