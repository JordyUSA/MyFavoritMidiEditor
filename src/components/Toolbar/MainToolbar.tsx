import { useRef, useState } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { parseMidiFile, readFileAsArrayBuffer, type MidiImportResult } from '@/midi/import';
import { downloadMidi, triggerDownload } from '@/midi/export';
import { exportProjectToMusicXml } from '@/musicxml/export';
import { downloadProject, parseProjectFile, readFileAsText, MfmeParseError } from '@/fileformat/mfme';
import { audioEngine } from '@/audio/engine';
import './MainToolbar.css';

export function MainToolbar() {
  const project = useProjectStore((s) => s.project);
  const newProject = useProjectStore((s) => s.newProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);

  const setActivePanel = useUiStore((s) => s.setActivePanel);
  const queueImports = useUiStore((s) => s.queueImports);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);

  const midiInputRef = useRef<HTMLInputElement>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onImportMidi = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const results: MidiImportResult[] = [];
    for (const file of Array.from(files)) {
      try {
        const buffer = await readFileAsArrayBuffer(file);
        results.push(parseMidiFile(buffer, file.name));
      } catch (err) {
        setError(`Couldn't import "${file.name}": ${(err as Error).message}`);
      }
    }
    if (results.length > 0) queueImports(results);
    if (midiInputRef.current) midiInputRef.current.value = '';
  };

  const onLoadProject = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const proj = parseProjectFile(text);
      loadProject(proj);
      setView('overview');
    } catch (err) {
      setError(err instanceof MfmeParseError ? err.message : `Couldn't open "${file.name}".`);
    }
    if (loadInputRef.current) loadInputRef.current.value = '';
  };

  const onExportWav = async () => {
    setRendering(true);
    try {
      const blob = await audioEngine.renderToWav(project);
      triggerDownload(blob, `${project.name || 'project'}.wav`);
    } catch (err) {
      setError(`Couldn't render audio: ${(err as Error).message}`);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="main-toolbar">
      <span className="app-title">🎹 MyFavoritMidiEditor</span>
      <input
        className="project-name-input"
        value={project.name}
        onChange={(e) => renameProject(e.target.value)}
      />
      <hr className="sep" />
      <div className="btn-group">
        <button className={`btn ${view === 'overview' ? 'toggled' : ''}`} onClick={() => setView('overview')}>
          Overview
        </button>
        <button className={`btn ${view === 'instrument' ? 'toggled' : ''}`} onClick={() => setView('instrument')} disabled={view !== 'instrument'}>
          Instrument
        </button>
      </div>
      <hr className="sep" />
      <button className="btn" onClick={() => confirm('Start a new project? Unsaved changes will be lost unless exported/saved.') && newProject()}>
        New
      </button>
      <button className="btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z not bound globally — use button)">
        ↶ Undo
      </button>
      <button className="btn" disabled={!canRedo} onClick={redo}>
        ↷ Redo
      </button>
      <hr className="sep" />
      <button className="btn" onClick={() => midiInputRef.current?.click()}>
        Import MIDI
      </button>
      <input ref={midiInputRef} type="file" accept=".mid,.midi" multiple hidden onChange={(e) => onImportMidi(e.target.files)} />
      <button className="btn" onClick={() => downloadMidi(project)}>
        Export MIDI
      </button>
      <button className="btn" onClick={() => triggerDownload(new Blob([exportProjectToMusicXml(project)], { type: 'application/vnd.recordare.musicxml+xml' }), `${project.name || 'project'}.musicxml`)}>
        Export MusicXML
      </button>
      <button className="btn" onClick={onExportWav} disabled={rendering}>
        {rendering ? 'Rendering…' : 'Export WAV'}
      </button>
      <hr className="sep" />
      <button className="btn" onClick={() => downloadProject(project)}>
        Save .mfme
      </button>
      <button className="btn" onClick={() => loadInputRef.current?.click()}>
        Open .mfme
      </button>
      <input ref={loadInputRef} type="file" accept=".mfme,application/json" hidden onChange={(e) => onLoadProject(e.target.files)} />
      <hr className="sep" />
      <button className="btn" onClick={() => setActivePanel('presetsBeats')}>
        🥁 Beat Presets
      </button>
      <button className="btn" onClick={() => setActivePanel('presetsSongs')}>
        🎼 Song Presets
      </button>
      {error && (
        <div className="toolbar-error" onClick={() => setError(null)} title="Click to dismiss">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
