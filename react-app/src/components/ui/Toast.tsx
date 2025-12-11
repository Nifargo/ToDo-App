import { type FC, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  variant?: ToastVariant;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: FC<ToastProps> = ({
  id,
  variant = 'info',
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const variantStyles: Record<ToastVariant, string> = {
    success: 'bg-secondary/10 border-secondary text-secondary',
    error: 'bg-danger/10 border-danger text-danger',
    warning: 'bg-amber-500/10 border-amber-500 text-amber-700',
    info: 'bg-primary/10 border-primary text-primary',
  };

  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'frosted-glass flex items-start gap-3 rounded-xl border-2 p-4 shadow-lg',
        'animate-slide-down',
        variantStyles[variant]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />

      <p className="flex-1 text-sm font-medium text-gray-900">
        {message}
      </p>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Container Component
export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    variant?: ToastVariant;
    message: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  const content = (
    <div
      className="fixed right-4 top-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );

  return createPortal(content, document.body);
};

export default Toast;