import { Modal } from './Modal';
import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import type { EffectType } from '@/state/types';
import './EffectsPanel.css';

const EFFECT_LABELS: Record<EffectType, string> = {
  reverb: 'Reverb',
  delay: 'Delay',
  chorus: 'Chorus',
  distortion: 'Distortion',
  eq3: '3-Band EQ',
  compressor: 'Compressor',
  phaser: 'Phaser',
  bitcrusher: 'Bitcrusher',
  tremolo: 'Tremolo',
  autoFilter: 'Auto Filter',
};

const PARAM_RANGES: Record<string, { min: number; max: number; step: number }> = {
  decay: { min: 0.1, max: 10, step: 0.1 },
  preDelay: { min: 0, max: 0.5, step: 0.01 },
  delayTime: { min: 0.01, max: 1, step: 0.01 },
  feedback: { min: 0, max: 0.95, step: 0.01 },
  frequency: { min: 0.05, max: 20, step: 0.05 },
  depth: { min: 0, max: 1, step: 0.01 },
  distortion: { min: 0, max: 1, step: 0.01 },
  low: { min: -24, max: 12, step: 1 },
  mid: { min: -24, max: 12, step: 1 },
  high: { min: -24, max: 12, step: 1 },
  threshold: { min: -60, max: 0, step: 1 },
  ratio: { min: 1, max: 20, step: 0.5 },
  attack: { min: 0.001, max: 1, step: 0.001 },
  release: { min: 0.01, max: 2, step: 0.01 },
  octaves: { min: 0.5, max: 8, step: 0.5 },
  bits: { min: 1, max: 16, step: 1 },
  baseFrequency: { min: 20, max: 2000, step: 10 },
};

export function EffectsPanel() {
  const activePanel = useUiStore((s) => s.activePanel);
  const setActivePanel = useUiStore((s) => s.setActivePanel);
  const target = useUiStore((s) => s.effectsTarget);
  const project = useProjectStore((s) => s.project);
  const addEffect = useProjectStore((s) => s.addEffect);
  const removeEffect = useProjectStore((s) => s.removeEffect);
  const updateEffect = useProjectStore((s) => s.updateEffect);

  if (activePanel !== 'effects' || !target) return null;
  const waveform = project.waveforms.find((w) => w.id === target.waveformId);
  const track = waveform?.tracks.find((t) => t.id === target.trackId);
  if (!track) return null;

  return (
    <Modal title={`Effects — ${track.name}`} onClose={() => setActivePanel('none')} width={520}>
      <div className="effects-list">
        {track.effects.length === 0 && <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No effects on this track yet.</p>}
        {track.effects.map((fx) => (
          <div key={fx.id} className="effect-card">
            <div className="effect-card-header">
              <label>
                <input
                  type="checkbox"
                  checked={fx.enabled}
                  onChange={(e) => updateEffect(target.waveformId, target.trackId, fx.id, { enabled: e.target.checked })}
                />
                <strong>{EFFECT_LABELS[fx.type]}</strong>
              </label>
              <button className="btn danger icon-only" onClick={() => removeEffect(target.waveformId, target.trackId, fx.id)}>
                ✕
              </button>
            </div>
            <div className="effect-params">
              {fx.type !== 'eq3' && fx.type !== 'compressor' && (
                <label className="effect-param">
                  <span>Wet</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={fx.wet}
                    onChange={(e) => updateEffect(target.waveformId, target.trackId, fx.id, { wet: Number(e.target.value) })}
                  />
                </label>
              )}
              {Object.entries(fx.params).map(([key, value]) => {
                const range = PARAM_RANGES[key] ?? { min: 0, max: 1, step: 0.01 };
                return (
                  <label key={key} className="effect-param">
                    <span>{key}</span>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={value}
                      onChange={(e) =>
                        updateEffect(target.waveformId, target.trackId, fx.id, {
                          params: { ...fx.params, [key]: Number(e.target.value) },
                        })
                      }
                    />
                    <span className="effect-param-value">{Number(value).toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="effect-add-row">
        <span className="field-label">Add effect</span>
        {(Object.keys(EFFECT_LABELS) as EffectType[]).map((type) => (
          <button key={type} className="btn" onClick={() => addEffect(target.waveformId, target.trackId, type)}>
            + {EFFECT_LABELS[type]}
          </button>
        ))}
      </div>
    </Modal>
  );
}
