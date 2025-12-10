import { type FC, type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Switch: FC<SwitchProps> = ({
  label,
  description,
  checked,
  disabled,
  className,
  id,
  ...props
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={switchId}
          className={cn(
            'relative flex h-7 w-12 cursor-pointer items-center rounded-full border-2 transition-all duration-300',
            'border-white/20 bg-white/10 backdrop-blur-sm',
            'peer-checked:border-emerald-500/50 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/30',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'hover:border-indigo-500/30'
          )}
        />
        <span
          className={cn(
            'pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-300',
            'peer-checked:translate-x-5'
          )}
        />
      </div>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={switchId}
              className="font-geometric cursor-pointer text-base font-medium text-white drop-shadow-lg select-none"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-white/70">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Switch;