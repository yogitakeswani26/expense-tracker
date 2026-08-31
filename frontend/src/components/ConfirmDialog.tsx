import React from 'react';
import Modal, { ModalSize } from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual tone — 'danger' for destructive actions like delete */
  tone?: 'danger' | 'default';
  isLoading?: boolean;
  error?: string | null;
  size?: ModalSize;
}

/**
 * Generic, reusable confirmation dialog built on top of <Modal />.
 * Used for delete confirmations, but works for any yes/no confirmation flow.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  error = null,
  size = 'sm',
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
      footer={
        <div className="modal-footer-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" /> Please wait…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      }
    >
      <div className="confirm-dialog-body">
        <div className={`confirm-icon ${tone}`}>{tone === 'danger' ? '⚠️' : 'ℹ️'}</div>
        <div className="confirm-message">{message}</div>
      </div>
      {error && <div className="modal-error-banner">⚠️ {error}</div>}
    </Modal>
  );
}
