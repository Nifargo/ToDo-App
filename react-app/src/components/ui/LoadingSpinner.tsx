import { type FC } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  fullScreen = false,
}) => {
  const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeStyles[size]
        )}
      />
      {text && (
        <p className="text-sm font-medium text-gray-600 animate-pulse-slow">
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
};

export default LoadingSpinner;