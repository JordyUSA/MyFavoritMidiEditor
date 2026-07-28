import { GM_FAMILIES, GM_INSTRUMENT_NAMES } from '@/utils/gmInstruments';
import type { InstrumentSpec } from '@/state/types';

interface InstrumentPickerProps {
  instrument: InstrumentSpec;
  onChange: (spec: InstrumentSpec) => void;
}

export function InstrumentPicker({ instrument, onChange }: InstrumentPickerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        className={`btn ${instrument.isDrumKit ? 'toggled' : ''}`}
        onClick={() =>
          onChange(
            instrument.isDrumKit
              ? { ...instrument, isDrumKit: false, name: GM_INSTRUMENT_NAMES[0] }
              : { ...instrument, isDrumKit: true, name: 'Standard Drum Kit' },
          )
        }
      >
        🥁 Drums
      </button>
      {!instrument.isDrumKit && (
        <select
          value={instrument.program}
          onChange={(e) => {
            const program = Number(e.target.value);
            onChange({ ...instrument, program, name: GM_INSTRUMENT_NAMES[program] });
          }}
        >
          {GM_FAMILIES.map((family) => (
            <optgroup key={family.name} label={family.name}>
              {Array.from({ length: family.programEnd - family.programStart + 1 }, (_, i) => family.programStart + i).map(
                (p) => (
                  <option key={p} value={p}>
                    {GM_INSTRUMENT_NAMES[p]}
                  </option>
                ),
              )}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}
