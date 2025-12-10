import { type FC, type InputHTMLAttributes, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox: FC<CheckboxProps> = ({
  label,
  checked,
  className,
  id,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2',
            'border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-200',
            'peer-checked:border-indigo-500 peer-checked:bg-gradient-to-br peer-checked:from-indigo-600 peer-checked:to-violet-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/30',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'hover:border-indigo-500/50'
          )}
        >
          {checked && (
            <Check
              className="h-3.5 w-3.5 text-white animate-scale-in"
              strokeWidth={3}
            />
          )}
        </label>
      </div>

      {label && (
        <label
          htmlFor={checkboxId}
          className="font-geometric cursor-pointer text-sm font-medium text-slate-300 select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;