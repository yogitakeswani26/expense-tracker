import { createPortal } from 'react-dom';
import type { Toast as ToastData, ToastPosition } from '../types/toast';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  position: ToastPosition;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

export default function ToastContainer({
  toasts,
  position,
  onDismiss,
  onPause,
  onResume,
}: ToastContainerProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className={`pointer-events-none fixed z-[9999] flex w-full max-w-sm flex-col gap-3 sm:w-auto ${POSITION_CLASSES[position]}`}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </div>,
    document.body
  );
}
