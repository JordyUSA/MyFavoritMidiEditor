import { useMemo, useRef } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { BeatRuler } from '@/components/common/BeatRuler';
import { Playhead } from '@/components/common/Playhead';
import { WaveformLane } from './WaveformLane';
import './OverviewView.css';

const SIDEBAR_WIDTH = 240;

export function OverviewView() {
  const project = useProjectStore((s) => s.project);
  const addWaveform = useProjectStore((s) => s.addWaveform);
  const pxPerBeat = useUiStore((s) => s.overviewPxPerBeat);
  const setZoom = useUiStore((s) => s.setOverviewZoom);
  const playheadBeat = useUiStore((s) => s.playheadBeat);
  const setPlayheadBeat = useUiStore((s) => s.setPlayheadBeat);
  const isPlaying = useUiStore((s) => s.isPlaying);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalBeats = useMemo(() => {
    let max = 32;
    for (const w of project.waveforms) {
      for (const t of w.tracks) {
        for (const n of t.notes) {
          max = Math.max(max, w.startOffset + n.start + n.duration + 8);
        }
      }
    }
    return max;
  }, [project.waveforms]);

  return (
    <div className="overview-view">
      <div className="overview-toolbar">
        <button className="btn primary" onClick={() => addWaveform()}>
          + Add Waveform
        </button>
        <div style={{ flex: 1 }} />
        <span className="field-label">Zoom</span>
        <input
          type="range"
          min={2}
          max={40}
          value={pxPerBeat}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>
      <div className="overview-scroll" ref={scrollRef}>
        <BeatRuler
          totalBeats={totalBeats}
          pxPerBeat={pxPerBeat}
          timeSignatureMap={project.timeSignatureMap}
          leftGutter={SIDEBAR_WIDTH}
          onScrub={(beat) => !isPlaying && setPlayheadBeat(beat)}
        />
        <div className="overview-lanes" style={{ position: 'relative' }}>
          {project.waveforms.length === 0 && (
            <div className="overview-empty">
              No waveforms yet. Import a MIDI file or click “Add Waveform” to start writing music.
            </div>
          )}
          {project.waveforms.map((w) => (
            <WaveformLane key={w.id} waveform={w} pxPerBeat={pxPerBeat} />
          ))}
          <Playhead beat={playheadBeat} pxPerBeat={pxPerBeat} leftGutter={SIDEBAR_WIDTH} height="100%" />
        </div>
      </div>
    </div>
  );
}
