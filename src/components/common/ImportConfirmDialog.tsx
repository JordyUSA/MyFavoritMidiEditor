import { Modal } from './Modal';
import { useUiStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';

export function ImportConfirmDialog() {
  const pending = useUiStore((s) => s.pendingImports);
  const dequeue = useUiStore((s) => s.dequeueImport);
  const activePanel = useUiStore((s) => s.activePanel);
  const addWaveformObject = useProjectStore((s) => s.addWaveformObject);
  const addTempoMarker = useProjectStore((s) => s.addTempoMarker);
  const addTimeSignatureMarker = useProjectStore((s) => s.addTimeSignatureMarker);

  if (activePanel !== 'importConfirm' || pending.length === 0) return null;
  const current = pending[0];
  const { waveform, detection } = current;

  const accept = () => {
    addTempoMarker({ beat: waveform.startOffset, bpm: detection.bpm });
    addTimeSignatureMarker({
      beat: waveform.startOffset,
      numerator: detection.timeSignature[0],
      denominator: detection.timeSignature[1],
    });
    addWaveformObject({ ...waveform, importInfo: { ...waveform.importInfo!, timingConfirmed: true } });
    dequeue();
  };

  const deny = () => {
    addWaveformObject({ ...waveform, importInfo: { ...waveform.importInfo!, timingConfirmed: false } });
    dequeue();
  };

  return (
    <Modal title="Confirm imported timing" width={460}>
      <p style={{ marginTop: 0 }}>
        <strong>{waveform.importInfo?.sourceFileName}</strong>
      </p>
      <p>{detection.message}</p>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
        {detection.confidence === 'variable'
          ? 'This project uses one tempo track; accepting will set the tempo/time signature starting where this waveform begins.'
          : 'Accepting applies this tempo and time signature to the project from this waveform’s start point.'}
        {' '}If you deny it, the notes still import at their correct musical positions, but the tempo grid for this
        waveform will be marked unconfirmed and won't change the project's tempo.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn" onClick={deny}>
          Deny — import without timing
        </button>
        <button className="btn primary" onClick={accept}>
          Confirm timing
        </button>
      </div>
      {pending.length > 1 && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
          {pending.length - 1} more file{pending.length - 1 === 1 ? '' : 's'} waiting to import…
        </p>
      )}
    </Modal>
  );
}
