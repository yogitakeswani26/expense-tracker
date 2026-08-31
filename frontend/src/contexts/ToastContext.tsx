import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 3
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast, maxToasts]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer position={position} toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ position, toasts, onRemove }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...getPositionStyles(position),
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            background: getBackgroundColor(toast.type),
            color: getTextColor(toast.type),
            border: getBorder(toast.type),
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
            animation: 'slideIn 0.3s ease-out',
            pointerEvents: 'auto',
            cursor: 'pointer',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => onRemove(toast.id)}
        >
          <span style={{ fontSize: '1.2rem' }}>{getIcon(toast.type)}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{toast.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(toast.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

function getPositionStyles(position: string): React.CSSProperties {
  const baseStyles: React.CSSProperties = {};
  if (position.includes('top')) baseStyles.top = 0;
  if (position.includes('bottom')) baseStyles.bottom = 0;
  if (position.includes('right')) baseStyles.right = 0;
  if (position.includes('left')) baseStyles.left = 0;
  return baseStyles;
}

function getBackgroundColor(type: ToastType): string {
  switch (type) {
    case 'success': return 'rgba(16, 185, 129, 0.9)';
    case 'error': return 'rgba(239, 68, 68, 0.9)';
    case 'warning': return 'rgba(245, 158, 11, 0.9)';
    case 'info': return 'rgba(59, 130, 246, 0.9)';
  }
}

function getTextColor(type: ToastType): string {
  return '#ffffff';
}

function getBorder(type: ToastType): string {
  switch (type) {
    case 'success': return '1px solid rgba(16, 185, 129, 0.5)';
    case 'error': return '1px solid rgba(239, 68, 68, 0.5)';
    case 'warning': return '1px solid rgba(245, 158, 11, 0.5)';
    case 'info': return '1px solid rgba(59, 130, 246, 0.5)';
  }
}
