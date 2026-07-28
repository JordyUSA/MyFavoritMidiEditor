import { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, StaveTie, Dot } from 'vexflow';
import type { Track, TimeSignatureMarker } from '@/state/types';
import { useProjectStore } from '@/state/projectStore';
import { buildMeasures, groupIntoEvents, assignVoices, renderLane, type Chunk } from '@/notation/model';
import { midiToVexKey } from '@/musicxml/vexPitch';
import { midiToNoteName } from '@/utils/gmInstruments';
import { usePreviewInstrument } from '@/audio/usePreviewInstrument';
import { Icon } from '@/components/common/Icon';
import './NotationView.css';

interface NotationViewProps {
  waveformId: string;
  track: Track;
  timeSignatureMap: TimeSignatureMarker[];
  barBeats: number;
}

const MEASURE_WIDTH = 220;
const STAVE_TOP = 40;
const STAVE_HEIGHT = 140;

const DURATION_CHOICES: { label: string; beats: number; symbol: string }[] = [
  { label: 'Whole', beats: 4, symbol: '𝅝' },
  { label: 'Half', beats: 2, symbol: '𝅗𝅥' },
  { label: 'Quarter', beats: 1, symbol: '♩' },
  { label: 'Eighth', beats: 0.5, symbol: '♪' },
  { label: '16th', beats: 0.25, symbol: '𝅘𝅥𝅯' },
];

function vexDurationForType(type: string): string {
  switch (type) {
    case 'whole':
      return 'w';
    case 'half':
      return 'h';
    case 'quarter':
      return 'q';
    case 'eighth':
      return '8';
    case '16th':
      return '16';
    case '32nd':
      return '32';
    case '64th':
      return '64';
    default:
      return 'q';
  }
}

export function NotationView({ waveformId, track, timeSignatureMap, barBeats }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const addNote = useProjectStore((s) => s.addNote);
  const removeNotes = useProjectStore((s) => s.removeNotes);

  const [selectedDuration, setSelectedDuration] = useState(1);
  const [dotted, setDotted] = useState(false);
  const [armedPitch, setArmedPitch] = useState(track.instrument.isDrumKit ? 38 : 60);
  const preview = usePreviewInstrument(track.instrument);

  const effectiveDuration = dotted ? selectedDuration * 1.5 : selectedDuration;

  const totalBeats = Math.max(barBeats * 4, ...track.notes.map((n) => n.start + n.duration + barBeats));
  const measures = buildMeasures(totalBeats, timeSignatureMap);
  const useBassClef =
    !track.instrument.isDrumKit &&
    track.notes.length > 0 &&
    track.notes.reduce((sum, n) => sum + n.pitch, 0) / track.notes.length < 55;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const width = measures.length * MEASURE_WIDTH + 40;
    const height = STAVE_TOP + STAVE_HEIGHT;
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    const events = groupIntoEvents(track.notes.map((n) => ({ pitch: n.pitch, start: n.start, duration: n.duration })));
    const { lanes } = assignVoices(events);
    const laneRenders = lanes.length > 0 ? lanes.map((lane) => renderLane(lane, measures)) : [];

    let x = 10;
    measures.forEach((m, mi) => {
      const stave = new Stave(x, STAVE_TOP, MEASURE_WIDTH);
      if (mi === 0) {
        stave.addClef(useBassClef ? 'bass' : 'treble');
        stave.addTimeSignature(`${m.numerator}/${m.denominator}`);
      }
      stave.setContext(context).draw();

      const voices: Voice[] = [];
      const allNotesForBeaming: StaveNote[] = [];
      const ties: { first: StaveNote; last: StaveNote }[] = [];

      (laneRenders.length > 0 ? laneRenders : [[]]).forEach((chunksByMeasure) => {
        const chunks: Chunk[] = chunksByMeasure[mi] ?? [];
        if (chunks.length === 0) return;
        const voice = new Voice({ num_beats: m.numerator, beat_value: m.denominator }).setMode(Voice.Mode.SOFT);
        let prevTieNote: StaveNote | null = null;
        const staveNotes = chunks.map((c) => {
          const keys = c.isRest
            ? [useBassClef ? 'd/3' : 'b/4']
            : c.pitches.map((p) => (track.instrument.isDrumKit ? 'b/4' : midiToVexKey(p)));
          const duration = vexDurationForType(c.value.type) + 'd'.repeat(c.value.dots) + (c.isRest ? 'r' : '');
          const note = new StaveNote({ keys, duration, clef: useBassClef ? 'bass' : 'treble' });
          if (c.value.dots > 0) Dot.buildAndAttach([note], { all: true });
          if (!c.isRest) {
            if (c.tieStop && prevTieNote) ties.push({ first: prevTieNote, last: note });
            prevTieNote = c.tieStart ? note : null;
            if (['eighth', '16th', '32nd', '64th'].includes(c.value.type)) allNotesForBeaming.push(note);
          } else {
            prevTieNote = null;
          }
          return note;
        });
        voice.addTickables(staveNotes);
        voices.push(voice);
      });

      if (voices.length > 0) {
        new Formatter().joinVoices(voices).format(voices, MEASURE_WIDTH - (mi === 0 ? 70 : 20));
        voices.forEach((v) => v.draw(context, stave));
        const beams = Beam.generateBeams(allNotesForBeaming);
        beams.forEach((b) => b.setContext(context).draw());
        ties.forEach((t) => new StaveTie({ first_note: t.first, last_note: t.last }).setContext(context).draw());
      }

      x += MEASURE_WIDTH;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.notes, track.instrument.isDrumKit, timeSignatureMap, useBassClef, measures.length]);

  const handleMeasureClick = (e: React.MouseEvent, measureIndex: number, erase: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const m = measures[measureIndex];
    const sig = { numerator: m.numerator, denominator: m.denominator };
    const barLenBeats = sig.numerator * (4 / sig.denominator);
    const measureStart = measures.slice(0, measureIndex).reduce((sum, mm) => sum + (mm.numerator * (4 / mm.denominator)), 0);
    const rawBeat = measureStart + fraction * barLenBeats;
    const snapped = Math.round(rawBeat / effectiveDuration) * effectiveDuration;

    if (erase) {
      const hits = track.notes.filter((n) => n.pitch === armedPitch && snapped >= n.start - 0.001 && snapped < n.start + n.duration - 0.001);
      if (hits.length > 0) removeNotes(waveformId, track.id, hits.map((n) => n.id));
      return;
    }
    const existing = track.notes.filter((n) => n.pitch === armedPitch && Math.abs(n.start - snapped) < 0.01);
    if (existing.length > 0) removeNotes(waveformId, track.id, existing.map((n) => n.id));
    addNote(waveformId, track.id, { pitch: armedPitch, start: Math.max(0, snapped), duration: effectiveDuration, velocity: 100 });
    preview(armedPitch);
  };

  return (
    <div className="notation-view">
      <div className="notation-toolbar">
        <span className="field-label">Note value</span>
        <div className="btn-group">
          {DURATION_CHOICES.map((d) => (
            <button
              key={d.label}
              className={`btn ${selectedDuration === d.beats ? 'toggled' : ''}`}
              title={d.label}
              onClick={() => setSelectedDuration(d.beats)}
            >
              {d.symbol}
            </button>
          ))}
        </div>
        <button className={`btn ${dotted ? 'toggled' : ''}`} onClick={() => setDotted((v) => !v)}>
          Dot •
        </button>
        <hr className="sep" />
        <span className="field-label">Pitch</span>
        <input
          type="number"
          min={0}
          max={127}
          value={armedPitch}
          onChange={(e) => setArmedPitch(Number(e.target.value))}
          style={{ width: 56 }}
        />
        <span>{track.instrument.isDrumKit ? '' : midiToNoteName(armedPitch)}</span>
        <button className="btn" onClick={() => preview(armedPitch)}>
          <Icon name="play" /> Hear
        </button>
        <span className="notation-hint">
          Click a measure to place the armed note · Shift+click to remove it · switch to Bars view to drag/resize freely
        </span>
      </div>
      <div className="notation-scroll">
        <div className="notation-svg-wrap" style={{ position: 'relative' }}>
          <div ref={containerRef} />
          <div className="notation-click-overlay" style={{ top: STAVE_TOP - 10, height: STAVE_HEIGHT }}>
            <div style={{ width: 10, flexShrink: 0 }} />
            {measures.map((m, mi) => (
              <div
                key={mi}
                className="notation-measure-hit"
                style={{ width: MEASURE_WIDTH }}
                onClick={(e) => handleMeasureClick(e, mi, e.shiftKey)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
