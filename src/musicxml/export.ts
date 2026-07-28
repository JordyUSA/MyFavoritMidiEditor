import type { Project, TempoMarker } from '@/state/types';
import { flattenProject } from '@/utils/flatten';
import { midiToXmlPitch } from './pitch';
import { XML_DIVISIONS } from './durations';
import { buildMeasures, groupIntoEvents, assignVoices, renderLane, type Chunk } from '@/notation/model';

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function chunkToXml(chunk: Chunk, voiceNumber: number): string {
  const { value } = chunk;
  const dotsXml = '<dot/>'.repeat(value.dots);
  if (chunk.isRest) {
    return `<note><rest/><duration>${value.div}</duration><voice>${voiceNumber}</voice><type>${value.type}</type>${dotsXml}</note>`;
  }
  return chunk.pitches
    .map((pitch, i) => {
      const p = midiToXmlPitch(pitch);
      const chordTag = i > 0 ? '<chord/>' : '';
      const tieTags =
        (chunk.tieStop ? '<tie type="stop"/>' : '') + (chunk.tieStart ? '<tie type="start"/>' : '');
      const notations =
        chunk.tieStart || chunk.tieStop
          ? `<notations>${chunk.tieStop ? '<tied type="stop"/>' : ''}${
              chunk.tieStart ? '<tied type="start"/>' : ''
            }</notations>`
          : '';
      return `<note>${chordTag}<pitch><step>${p.step}</step>${
        p.alter ? `<alter>${p.alter}</alter>` : ''
      }<octave>${p.octave}</octave></pitch><duration>${value.div}</duration>${tieTags}<voice>${voiceNumber}</voice><type>${
        value.type
      }</type>${dotsXml}${notations}</note>`;
    })
    .join('');
}

function tempoDirectionsForMeasure(measureStartBeat: number, measureEndBeat: number, tempoMap: TempoMarker[]): string {
  const markers = tempoMap.filter((t) => t.beat >= measureStartBeat && t.beat < measureEndBeat);
  return markers
    .map(
      (m) =>
        `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.round(
          m.bpm,
        )}</per-minute></metronome></direction-type><sound tempo="${Math.round(m.bpm)}"/></direction>`,
    )
    .join('');
}

/**
 * Exports the project as a MusicXML 4.0 "partwise" score — the open,
 * text-based standard notation interchange format supported by MuseScore,
 * Finale, Sibelius, LilyPond, and most other notation software. Uses the
 * same measure/voice/tie model as the in-app Notation view, so what you see
 * there is what gets exported.
 *
 * Known simplifications: all key signatures are written as C major/A minor
 * (no key detection), pitch spelling always prefers sharps, percussion
 * tracks are notated with normal pitches rather than unpitched noteheads,
 * and at most 4 simultaneous overlapping voices per part are notated (any
 * further overlap is dropped from the notation only — the MIDI export is
 * unaffected). Non-standard durations are rounded to the nearest 64th note.
 */
export function exportProjectToMusicXml(project: Project): string {
  const flat = flattenProject(project).filter((ft) => !ft.effectivelyMuted && ft.notes.length > 0);
  const totalBeats = Math.max(
    4,
    ...flat.flatMap((ft) => ft.notes.map((n) => n.absoluteStart + n.duration)),
    ...project.tempoMap.map((t) => t.beat),
  );
  const measures = buildMeasures(totalBeats, project.timeSignatureMap);

  const parts = flat.map((ft, idx) => {
    const partId = `P${idx + 1}`;
    const events = groupIntoEvents(ft.notes.map((n) => ({ pitch: n.pitch, start: n.absoluteStart, duration: n.duration })));
    const { lanes } = assignVoices(events);
    const laneRenders = lanes.map((lane) => renderLane(lane, measures));

    const avgPitch =
      ft.notes.reduce((sum, n) => sum + n.pitch, 0) / Math.max(1, ft.notes.length);
    const useBassClef = avgPitch < 55;

    const measuresXml = measures
      .map((m, mi) => {
        const isFirst = mi === 0;
        const prevSig = mi > 0 ? measures[mi - 1] : null;
        const sigChanged = !prevSig || prevSig.numerator !== m.numerator || prevSig.denominator !== m.denominator;
        const attributes = isFirst || sigChanged
          ? `<attributes>${isFirst ? `<divisions>${XML_DIVISIONS}</divisions><key><fifths>0</fifths></key>` : ''}<time><beats>${m.numerator}</beats><beat-type>${m.denominator}</beat-type></time>${
              isFirst ? `<clef><sign>${useBassClef ? 'F' : 'G'}</sign><line>${useBassClef ? 4 : 2}</line></clef>` : ''
            }</attributes>`
          : '';
        const measureStartBeat = m.start / XML_DIVISIONS;
        const measureEndBeat = m.end / XML_DIVISIONS;
        const directions = tempoDirectionsForMeasure(measureStartBeat, measureEndBeat, project.tempoMap);

        const voicesXml = laneRenders
          .map((chunksByMeasure, vi) => {
            const chunks = chunksByMeasure[mi] ?? [];
            const notesXml = chunks.map((c) => chunkToXml(c, vi + 1)).join('');
            const backup = vi > 0 ? `<backup><duration>${m.end - m.start}</duration></backup>` : '';
            return backup + notesXml;
          })
          .join('');

        return `<measure number="${mi + 1}">${attributes}${directions}${voicesXml}</measure>`;
      })
      .join('');

    return {
      partId,
      name: ft.track.name,
      xml: `<part id="${partId}">${measuresXml}</part>`,
    };
  });

  const partList = parts
    .map((p) => `<score-part id="${p.partId}"><part-name>${xmlEscape(p.name)}</part-name></score-part>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${xmlEscape(project.name)}</work-title></work>
  <identification>
    <encoding><software>MyFavoritMidiEditor</software></encoding>
  </identification>
  <part-list>${partList}</part-list>
  ${parts.map((p) => p.xml).join('\n  ')}
</score-partwise>
`;
}
