import { useEffect, useState } from 'react';
import type { Toast as ToastData, ToastType } from '../types/toast';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.516-2.63L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const TYPE_STYLES: Record<ToastType, { border: string; icon: string; bar: string }> = {
  success: { border: 'border-l-4 border-l-success', icon: 'text-success', bar: 'bg-success' },
  error: { border: 'border-l-4 border-l-danger', icon: 'text-danger', bar: 'bg-danger' },
  warning: { border: 'border-l-4 border-l-warning', icon: 'text-warning', bar: 'bg-warning' },
  info: { border: 'border-l-4 border-l-primary', icon: 'text-primary', bar: 'bg-primary' },
};

export default function Toast({ toast, onDismiss, onPause, onResume }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const styles = TYPE_STYLES[toast.type];

  useEffect(() => {
    // Trigger enter animation on mount
    const raf = requestAnimationFrame(() => setIsEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    // Wait for exit animation before actually removing from state.
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => toast.pauseOnHover && onPause(toast.id)}
      onMouseLeave={() => toast.pauseOnHover && onResume(toast.id)}
      className={[
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl',
        'bg-[var(--bg-card,#1a202c)] shadow-lg ring-1 ring-black/5',
        styles.border,
        'transition-all duration-200 ease-out',
        isLeaving
          ? 'opacity-0 translate-x-4 scale-95'
          : isEntered
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-4 scale-95',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`mt-0.5 flex-shrink-0 ${styles.icon}`}>{ICONS[toast.type]}</span>

        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold text-[var(--text-primary,#f1f5f9)]">
              {toast.title}
            </p>
          )}
          <p className="break-words text-sm text-[var(--text-secondary,#cbd5e1)]">
            {toast.message}
          </p>

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                handleDismiss();
              }}
              className={`mt-2 text-sm font-semibold underline-offset-2 hover:underline ${styles.icon}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="flex-shrink-0 rounded-md p-1 text-[var(--text-tertiary,#94a3b8)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary,#f1f5f9)]"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {toast.duration > 0 && Number.isFinite(toast.duration) && (
        <div className="h-1 w-full bg-white/10">
          <div
            className={`h-full ${styles.bar} toast-progress`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}
