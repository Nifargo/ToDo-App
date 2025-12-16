import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  id,
  style,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-geometric text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-gray-900 placeholder:text-slate-500 backdrop-blur-xl',
            'transition-all duration-200',
            'focus:border-indigo-500/50 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
            'disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-600',
            error && 'border-danger/50 focus:border-danger/50 focus:ring-danger/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            // For date inputs with left icon, add equal right padding to center the text
            props.type === 'date' && leftIcon && 'pr-10',
            props.type === 'date' ? 'text-center' : 'text-left',
            className
          )}
          style={style}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;