import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import { bpmAtBeat, beatsToSeconds, timeSignatureAtBeat, beatsPerBar } from '@/utils/time';
import { Icon } from '@/components/common/Icon';
import './TransportBar.css';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TransportBar() {
  const project = useProjectStore((s) => s.project);
  const updateTempoMarker = useProjectStore((s) => s.updateTempoMarker);
  const addTempoMarker = useProjectStore((s) => s.addTempoMarker);
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume);

  const isPlaying = useUiStore((s) => s.isPlaying);
  const setIsPlaying = useUiStore((s) => s.setIsPlaying);
  const isLoadingAudio = useUiStore((s) => s.isLoadingAudio);
  const playheadBeat = useUiStore((s) => s.playheadBeat);
  const setPlayheadBeat = useUiStore((s) => s.setPlayheadBeat);
  const loopEnabled = useUiStore((s) => s.loopEnabled);
  const loopStart = useUiStore((s) => s.loopStart);
  const loopEnd = useUiStore((s) => s.loopEnd);
  const setLoop = useUiStore((s) => s.setLoop);
  const metronomeEnabled = useUiStore((s) => s.metronomeEnabled);
  const setMetronome = useUiStore((s) => s.setMetronome);

  const bpm = bpmAtBeat(playheadBeat, project.tempoMap);
  const sig = timeSignatureAtBeat(playheadBeat, project.timeSignatureMap);
  const bpb = beatsPerBar(sig);
  const bar = Math.floor(playheadBeat / bpb) + 1;
  const beatInBar = Math.floor(playheadBeat % bpb) + 1;
  const seconds = beatsToSeconds(playheadBeat, project.tempoMap);

  return (
    <div className="transport-bar">
      <button className="btn icon-only" title="Stop" onClick={() => { setIsPlaying(false); setPlayheadBeat(0); }}>
        <Icon name="stop" />
      </button>
      <button className="btn primary icon-only" title={isPlaying ? 'Pause' : 'Play'} onClick={() => setIsPlaying(!isPlaying)}>
        {isLoadingAudio ? <span className="spinner" /> : <Icon name={isPlaying ? 'pause' : 'play'} />}
      </button>
      <div className="transport-time">
        <span className="transport-bars mono">
          {bar}:{beatInBar}
        </span>
        <span className="transport-seconds mono">{formatTime(seconds)}</span>
      </div>
      {isLoadingAudio && <span className="transport-loading">Loading instrument sounds…</span>}
      <hr className="sep" />
      <label className="transport-field">
        <span className="field-label">BPM</span>
        <input
          className="mono"
          type="number"
          min={20}
          max={300}
          value={Math.round(bpm)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (project.tempoMap.some((m) => m.beat === 0)) updateTempoMarker(0, { bpm: v });
            else addTempoMarker({ beat: 0, bpm: v });
          }}
        />
      </label>
      <span className="field-label mono">
        {sig.numerator}/{sig.denominator}
      </span>
      <hr className="sep" />
      <button className={`btn ${loopEnabled ? 'toggled' : ''}`} title="Loop" onClick={() => setLoop(!loopEnabled)}>
        <Icon name="loop" /> Loop
      </button>
      {loopEnabled && (
        <>
          <input
            type="number"
            className="transport-loop-input mono"
            value={loopStart}
            min={0}
            onChange={(e) => setLoop(true, Number(e.target.value), undefined)}
            title="Loop start (beats)"
          />
          <span>–</span>
          <input
            type="number"
            className="transport-loop-input mono"
            value={loopEnd}
            min={0}
            onChange={(e) => setLoop(true, undefined, Number(e.target.value))}
            title="Loop end (beats)"
          />
        </>
      )}
      <button className={`btn ${metronomeEnabled ? 'toggled' : ''}`} title="Metronome" onClick={() => setMetronome(!metronomeEnabled)}>
        <Icon name="metronome" /> Click
      </button>
      <hr className="sep" />
      <span className="field-label">Master</span>
      <input
        type="range"
        min={-40}
        max={6}
        value={project.masterVolume}
        onChange={(e) => setMasterVolume(Number(e.target.value))}
      />
    </div>
  );
}
