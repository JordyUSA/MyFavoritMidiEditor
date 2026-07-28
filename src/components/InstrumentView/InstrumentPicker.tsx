import { GM_FAMILIES, GM_INSTRUMENT_NAMES } from '@/utils/gmInstruments';
import { DRUM_MACHINE_NAMES, DEFAULT_DRUM_MACHINE } from '@/audio/drumMachineMap';
import { Icon } from '@/components/common/Icon';
import type { InstrumentSpec } from '@/state/types';

interface InstrumentPickerProps {
  instrument: InstrumentSpec;
  onChange: (spec: InstrumentSpec) => void;
}

export function InstrumentPicker({ instrument, onChange }: InstrumentPickerProps) {
  const isRealistic = instrument.source === 'soundfont';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        className={`btn ${instrument.isDrumKit ? 'toggled' : ''}`}
        onClick={() =>
          onChange(
            instrument.isDrumKit
              ? { ...instrument, isDrumKit: false, name: GM_INSTRUMENT_NAMES[0] }
              : { ...instrument, isDrumKit: true, drumKitName: instrument.drumKitName ?? DEFAULT_DRUM_MACHINE, name: `${instrument.drumKitName ?? DEFAULT_DRUM_MACHINE} Drum Machine` },
          )
        }
      >
        <Icon name="drum" /> Drums
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
      {instrument.isDrumKit && isRealistic && (
        <select
          value={instrument.drumKitName ?? DEFAULT_DRUM_MACHINE}
          onChange={(e) => onChange({ ...instrument, drumKitName: e.target.value, name: `${e.target.value} Drum Machine` })}
        >
          {DRUM_MACHINE_NAMES.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      )}
      <div className="btn-group" title="Realistic uses real sampled audio (downloads on first play); Fast is a fully offline synthesizer">
        <button
          className={`btn ${isRealistic ? 'toggled' : ''}`}
          onClick={() => onChange({ ...instrument, source: 'soundfont' })}
        >
          <Icon name="headphones" /> Realistic
        </button>
        <button
          className={`btn ${!isRealistic ? 'toggled' : ''}`}
          onClick={() => onChange({ ...instrument, source: 'synth' })}
        >
          <Icon name="bolt" /> Fast
        </button>
      </div>
    </div>
  );
}
