import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import { BEAT_PRESETS, instantiateBeatPreset } from '@/presets/beatPresets';
import { createInstrument, createTrack, createWaveform } from '@/state/factories';
import { projectEndBeat } from '@/utils/flatten';
import './Presets.css';

export function BeatPresetsPanel() {
  const activePanel = useUiStore((s) => s.activePanel);
  const setActivePanel = useUiStore((s) => s.setActivePanel);
  const project = useProjectStore((s) => s.project);
  const addWaveformObject = useProjectStore((s) => s.addWaveformObject);
  const addTempoMarker = useProjectStore((s) => s.addTempoMarker);
  const [repeats, setRepeats] = useState(8);
  const [appendAtEnd, setAppendAtEnd] = useState(true);

  if (activePanel !== 'presetsBeats') return null;

  const insert = (presetId: string) => {
    const preset = BEAT_PRESETS.find((p) => p.id === presetId)!;
    const startBeat = appendAtEnd ? projectEndBeat(project) : 0;
    const notes = instantiateBeatPreset(preset, 0, repeats);
    const track = createTrack({ name: `${preset.name} Drums`, instrument: createInstrument(0, true), notes });
    const waveform = createWaveform({ name: preset.name, startOffset: startBeat, tracks: [track] });
    addWaveformObject(waveform);
    addTempoMarker({ beat: startBeat, bpm: preset.bpm });
    setActivePanel('none');
  };

  return (
    <Modal title="Beat Presets" onClose={() => setActivePanel('none')} width={640}>
      <div className="presets-controls">
        <label>
          Loops: <input type="number" min={1} max={64} value={repeats} onChange={(e) => setRepeats(Number(e.target.value))} />
        </label>
        <label>
          <input type="checkbox" checked={appendAtEnd} onChange={(e) => setAppendAtEnd(e.target.checked)} />
          Append after existing content
        </label>
      </div>
      <div className="presets-list">
        {BEAT_PRESETS.map((p) => (
          <div key={p.id} className="preset-row">
            <div>
              <div className="preset-row-title">
                {p.name} <span className="preset-genre">{p.genre}</span>
              </div>
              <div className="preset-row-desc">
                {p.description} · {p.bpm} BPM
              </div>
            </div>
            <button className="btn primary" onClick={() => insert(p.id)}>
              Insert
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
