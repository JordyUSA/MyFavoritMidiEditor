import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width }: ModalProps) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel" style={width ? { width } : undefined}>
        <div className="modal-header">
          <h2>{title}</h2>
          {onClose && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
