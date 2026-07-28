import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import { bpmAtBeat, beatsToSeconds, timeSignatureAtBeat, beatsPerBar } from '@/utils/time';
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
        ⏹
      </button>
      <button className={`btn primary icon-only`} title={isPlaying ? 'Pause' : 'Play'} onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="transport-time">
        <span className="transport-bars">
          {bar}:{beatInBar}
        </span>
        <span className="transport-seconds">{formatTime(seconds)}</span>
      </div>
      <hr className="sep" />
      <label className="transport-field">
        <span className="field-label">BPM</span>
        <input
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
      <span className="field-label">
        {sig.numerator}/{sig.denominator}
      </span>
      <hr className="sep" />
      <button className={`btn ${loopEnabled ? 'toggled' : ''}`} title="Loop" onClick={() => setLoop(!loopEnabled)}>
        🔁 Loop
      </button>
      {loopEnabled && (
        <>
          <input
            type="number"
            className="transport-loop-input"
            value={loopStart}
            min={0}
            onChange={(e) => setLoop(true, Number(e.target.value), undefined)}
            title="Loop start (beats)"
          />
          <span>–</span>
          <input
            type="number"
            className="transport-loop-input"
            value={loopEnd}
            min={0}
            onChange={(e) => setLoop(true, undefined, Number(e.target.value))}
            title="Loop end (beats)"
          />
        </>
      )}
      <button className={`btn ${metronomeEnabled ? 'toggled' : ''}`} title="Metronome" onClick={() => setMetronome(!metronomeEnabled)}>
        🥁 Click
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
