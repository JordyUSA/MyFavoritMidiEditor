import type { Project, TimeSignatureMarker } from '@/state/types';
import { beatsPerBar, timeSignatureAtBeat } from '@/utils/time';
import { decomposeDuration, roundToAtomic, XML_DIVISIONS, type NoteValue } from '@/musicxml/durations';

export { XML_DIVISIONS };

export interface Measure {
  start: number; // in divisions, global
  end: number;
  numerator: number;
  denominator: number;
}

export interface NoteEvent {
  pitches: number[];
  startDiv: number;
  durationDiv: number;
}

export interface Chunk {
  isRest: boolean;
  pitches: number[];
  value: NoteValue;
  tieStart: boolean;
  tieStop: boolean;
}

const MAX_VOICES = 4;

/**
 * Shared rhythm/measure model used by both the MusicXML exporter and the
 * in-app staff notation view, so what you see on screen always matches what
 * gets exported.
 */
export function buildMeasures(totalBeats: number, timeSignatureMap: TimeSignatureMarker[]): Measure[] {
  const measures: Measure[] = [];
  let beat = 0;
  const totalDiv = roundToAtomic(totalBeats * XML_DIVISIONS) || XML_DIVISIONS * 4;
  let div = 0;
  while (div < totalDiv) {
    const sig = timeSignatureAtBeat(beat, timeSignatureMap);
    const lenBeats = beatsPerBar(sig);
    const lenDiv = Math.round(lenBeats * XML_DIVISIONS);
    measures.push({ start: div, end: div + lenDiv, numerator: sig.numerator, denominator: sig.denominator });
    div += lenDiv;
    beat += lenBeats;
  }
  if (measures.length === 0) {
    measures.push({ start: 0, end: XML_DIVISIONS * 4, numerator: 4, denominator: 4 });
  }
  return measures;
}

export function buildMeasuresForProject(project: Project, totalBeats: number): Measure[] {
  return buildMeasures(totalBeats, project.timeSignatureMap);
}

export function groupIntoEvents(notes: { pitch: number; start: number; duration: number }[]): NoteEvent[] {
  const sorted = notes
    .map((n) => ({
      pitch: n.pitch,
      startDiv: roundToAtomic(n.start * XML_DIVISIONS),
      durationDiv: Math.max(3, roundToAtomic(n.duration * XML_DIVISIONS)),
    }))
    .sort((a, b) => a.startDiv - b.startDiv || a.durationDiv - b.durationDiv);

  const events: NoteEvent[] = [];
  for (const n of sorted) {
    const last = events[events.length - 1];
    if (last && last.startDiv === n.startDiv && last.durationDiv === n.durationDiv) {
      last.pitches.push(n.pitch);
    } else {
      events.push({ pitches: [n.pitch], startDiv: n.startDiv, durationDiv: n.durationDiv });
    }
  }
  return events;
}

/** Greedily assigns non-overlapping events to up to MAX_VOICES lanes. Extra overlaps are dropped. */
export function assignVoices(events: NoteEvent[]): { lanes: NoteEvent[][]; dropped: number } {
  const lanes: NoteEvent[][] = [];
  const laneEnds: number[] = [];
  let dropped = 0;
  for (const ev of events) {
    let laneIdx = laneEnds.findIndex((end) => end <= ev.startDiv);
    if (laneIdx === -1) {
      if (lanes.length >= MAX_VOICES) {
        dropped += 1;
        continue;
      }
      laneIdx = lanes.length;
      lanes.push([]);
      laneEnds.push(0);
    }
    lanes[laneIdx].push(ev);
    laneEnds[laneIdx] = ev.startDiv + ev.durationDiv;
  }
  return { lanes, dropped };
}

/** Renders one voice lane across every measure, filling gaps with rests and tying notes over barlines. */
export function renderLane(lane: NoteEvent[], measures: Measure[]): Chunk[][] {
  const byMeasure: Chunk[][] = measures.map(() => []);
  if (measures.length === 0) return byMeasure;

  let measureIdx = 0;
  let cursor = measures[0].start;

  const pushRest = (mIdx: number, start: number, end: number) => {
    for (const value of decomposeDuration(end - start)) {
      byMeasure[mIdx].push({ isRest: true, pitches: [], value, tieStart: false, tieStop: false });
    }
  };

  for (const ev of lane) {
    while (measureIdx < measures.length && cursor < ev.startDiv) {
      const m = measures[measureIdx];
      const gapEnd = Math.min(ev.startDiv, m.end);
      if (gapEnd > cursor) pushRest(measureIdx, cursor, gapEnd);
      cursor = gapEnd;
      if (cursor >= m.end) {
        measureIdx += 1;
        if (measureIdx < measures.length) cursor = measures[measureIdx].start;
      }
    }
    if (measureIdx >= measures.length) break;

    let segStart = ev.startDiv;
    let remaining = ev.durationDiv;
    let firstSegment = true;
    while (remaining > 0 && measureIdx < measures.length) {
      const m = measures[measureIdx];
      const segEnd = Math.min(segStart + remaining, m.end);
      const segDur = segEnd - segStart;
      const continuesToNext = segEnd < segStart + remaining;
      const values = decomposeDuration(segDur);
      values.forEach((value, i) => {
        const isFirstInternal = i === 0;
        const isLastInternal = i === values.length - 1;
        byMeasure[measureIdx].push({
          isRest: false,
          pitches: ev.pitches,
          value,
          tieStart: !isLastInternal || continuesToNext,
          tieStop: !isFirstInternal || !firstSegment,
        });
      });
      remaining -= segDur;
      segStart = segEnd;
      cursor = segEnd;
      firstSegment = false;
      if (continuesToNext) {
        measureIdx += 1;
        if (measureIdx < measures.length) cursor = measures[measureIdx].start;
      }
    }
  }

  while (measureIdx < measures.length) {
    const m = measures[measureIdx];
    if (cursor < m.end) pushRest(measureIdx, cursor, m.end);
    measureIdx += 1;
    if (measureIdx < measures.length) cursor = measures[measureIdx].start;
  }

  return byMeasure;
}
