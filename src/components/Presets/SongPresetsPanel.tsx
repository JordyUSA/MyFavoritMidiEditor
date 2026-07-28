import { Modal } from '@/components/common/Modal';
import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import { SONG_PRESETS, instantiateSongPreset } from '@/presets/songPresets';
import { BEAT_PRESETS, instantiateBeatPreset } from '@/presets/beatPresets';
import { createInstrument, createTrack, createWaveform } from '@/state/factories';
import { projectEndBeat } from '@/utils/flatten';
import './Presets.css';

export function SongPresetsPanel() {
  const activePanel = useUiStore((s) => s.activePanel);
  const setActivePanel = useUiStore((s) => s.setActivePanel);
  const project = useProjectStore((s) => s.project);
  const addWaveformObject = useProjectStore((s) => s.addWaveformObject);
  const addTempoMarker = useProjectStore((s) => s.addTempoMarker);

  if (activePanel !== 'presetsSongs') return null;

  const insert = (presetId: string) => {
    const preset = SONG_PRESETS.find((p) => p.id === presetId)!;
    const startBeat = projectEndBeat(project);
    const { chordNotes, bassNotes, lengthBeats } = instantiateSongPreset(preset, 0);

    const chordsTrack = createTrack({
      name: 'Chords',
      instrument: createInstrument(0, false), // acoustic grand piano
      notes: chordNotes,
    });
    const bassTrack = createTrack({
      name: 'Bass',
      instrument: createInstrument(32, false), // acoustic bass
      notes: bassNotes,
    });

    const tracks = [chordsTrack, bassTrack];
    const beatPreset = preset.suggestedBeatPresetId ? BEAT_PRESETS.find((b) => b.id === preset.suggestedBeatPresetId) : undefined;
    if (beatPreset) {
      const repeats = Math.max(1, Math.round(lengthBeats / beatPreset.lengthBeats));
      tracks.push(
        createTrack({
          name: `${beatPreset.name} Drums`,
          instrument: createInstrument(0, true),
          notes: instantiateBeatPreset(beatPreset, 0, repeats),
        }),
      );
    }

    const waveform = createWaveform({ name: preset.name, startOffset: startBeat, tracks });
    addWaveformObject(waveform);
    addTempoMarker({ beat: startBeat, bpm: preset.bpm });
    setActivePanel('none');
  };

  return (
    <Modal title="Song Presets" onClose={() => setActivePanel('none')} width={640}>
      <p style={{ marginTop: 0, color: 'var(--text-2)', fontSize: 13 }}>
        Adds a new waveform with chord + bass tracks (and a matching drum beat, where suggested) in {SONG_PRESETS[0].key}.
        Use the piano roll's transpose tool to shift into any other key.
      </p>
      <div className="presets-list">
        {SONG_PRESETS.map((p) => (
          <div key={p.id} className="preset-row">
            <div>
              <div className="preset-row-title">
                {p.name} <span className="preset-genre">{p.key} {p.mode}</span>
              </div>
              <div className="preset-row-desc">
                {p.description} · {p.bpm} BPM · {p.chords.map((c) => c.roman).join('–')}
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
