import type { Track } from '@/state/types';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { gmFamilyForProgram } from '@/utils/gmInstruments';
import { NoteDensityStrip } from './NoteDensityStrip';
import { Icon } from '@/components/common/Icon';
import './TrackRow.css';

interface TrackRowProps {
  waveformId: string;
  track: Track;
}

export function TrackRow({ waveformId, track }: TrackRowProps) {
  const updateTrack = useProjectStore((s) => s.updateTrack);
  const removeTrack = useProjectStore((s) => s.removeTrack);
  const openInstrumentView = useUiStore((s) => s.openInstrumentView);
  const openEffectsFor = useUiStore((s) => s.openEffectsFor);

  const family = track.instrument.isDrumKit ? 'Drums' : gmFamilyForProgram(track.instrument.program).name;

  return (
    <div className="track-row" style={{ borderLeftColor: track.color }}>
      <button
        className="btn icon-only"
        title={track.muted ? 'Unmute' : 'Mute'}
        onClick={() => updateTrack(waveformId, track.id, { muted: !track.muted })}
      >
        <Icon name={track.muted ? 'mute' : 'volume'} />
      </button>
      <button
        className={`btn icon-only ${track.solo ? 'toggled' : ''}`}
        title="Solo"
        onClick={() => updateTrack(waveformId, track.id, { solo: !track.solo })}
      >
        S
      </button>
      <div className="track-row-name" onDoubleClick={() => openInstrumentView(waveformId, track.id)}>
        <span className="track-row-title">{track.name}</span>
        <span className="track-row-family">
          {family} · {track.instrument.name}
        </span>
      </div>
      <div className="track-row-strip">
        <NoteDensityStrip notes={track.notes} widthPx={180} heightPx={28} pxPerBeat={4} color={track.color} />
      </div>
      <input
        type="range"
        min={-40}
        max={6}
        step={1}
        value={track.volume}
        onChange={(e) => updateTrack(waveformId, track.id, { volume: Number(e.target.value) })}
        title={`Volume ${track.volume}dB`}
      />
      <button className="btn icon-only" title="Effects" onClick={() => openEffectsFor(waveformId, track.id)}>
        <Icon name="sliders" />
        {track.effects.length > 0 ? track.effects.length : ''}
      </button>
      <button className="btn primary" onClick={() => openInstrumentView(waveformId, track.id)}>
        Open
      </button>
      <button className="btn danger icon-only" title="Delete track" onClick={() => removeTrack(waveformId, track.id)}>
        <Icon name="trash" />
      </button>
    </div>
  );
}
