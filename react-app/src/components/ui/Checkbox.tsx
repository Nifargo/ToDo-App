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
    <div className="flex items-center gap-2">
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
            'border-gray-300 bg-white transition-all duration-200',
            'peer-checked:border-primary peer-checked:bg-primary',
            'peer-focus:ring-2 peer-focus:ring-primary/20 peer-focus:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'hover:border-primary',
            className
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
          className="cursor-pointer text-sm font-medium text-gray-700 select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;