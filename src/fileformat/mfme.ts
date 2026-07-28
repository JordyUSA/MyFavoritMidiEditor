import type { Project } from '@/state/types';
import { triggerDownload } from '@/midi/export';

/**
 * .mfme is this app's native project format: a versioned, pretty-printed
 * JSON document holding the whole Project (waveforms, tracks, notes, tempo
 * map, effects, etc.) so a project can be saved and reopened losslessly,
 * unlike MIDI/MusicXML export which are lossy interchange formats.
 */
export const MFME_EXTENSION = '.mfme';
const MFME_MAGIC = 'MyFavoritMidiEditor-ProjectFile';

interface MfmeDocument {
  magic: string;
  savedAt: string;
  appVersion: string;
  project: Project;
}

export function serializeProject(project: Project): string {
  const doc: MfmeDocument = {
    magic: MFME_MAGIC,
    savedAt: new Date().toISOString(),
    appVersion: '0.1.0',
    project,
  };
  return JSON.stringify(doc, null, 2);
}

export function downloadProject(project: Project): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, `${sanitizeFileName(project.name) || 'project'}${MFME_EXTENSION}`);
}

export class MfmeParseError extends Error {}

export function parseProjectFile(text: string): Project {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new MfmeParseError('This file is not valid JSON, so it cannot be a .mfme project file.');
  }
  const doc = parsed as Partial<MfmeDocument>;
  if (!doc || typeof doc !== 'object' || doc.magic !== MFME_MAGIC || !doc.project) {
    throw new MfmeParseError('This file does not look like a MyFavoritMidiEditor project (.mfme) file.');
  }
  const project = migrateProject(doc.project);
  return project;
}

function migrateProject(project: Project): Project {
  if (project.formatVersion === 1) return project;
  throw new MfmeParseError(`Unsupported project format version: ${(project as { formatVersion?: unknown }).formatVersion}`);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
