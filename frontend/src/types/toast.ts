/**
 * Toast / Notification system types.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface ToastAction {
  /** Button label shown inside the toast */
  label: string;
  /** Handler invoked when the action button is clicked */
  onClick: () => void;
}

export interface ToastOptions {
  /** Type of toast, controls icon/color. Defaults to 'info'. */
  type?: ToastType;
  /** Optional title shown above the message in bold */
  title?: string;
  /** Auto-dismiss delay in ms. Set to 0 (or Infinity) to disable auto-dismiss. Defaults to 5000. */
  duration?: number;
  /** Optional single action button (e.g. "Undo") */
  action?: ToastAction;
  /** Whether the toast shows a manual close (X) button. Defaults to true. */
  dismissible?: boolean;
  /** Pause the auto-dismiss timer while the user hovers the toast. Defaults to true. */
  pauseOnHover?: boolean;
}

export interface Toast extends Required<Omit<ToastOptions, 'action' | 'title'>> {
  id: string;
  message: string;
  title?: string;
  action?: ToastAction;
  createdAt: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  /** Generic toast trigger */
  showToast: (message: string, options?: ToastOptions) => string;
  /** Convenience helpers */
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  /** Dismiss a single toast by id */
  dismiss: (id: string) => void;
  /** Dismiss every active toast */
  dismissAll: () => void;
}
