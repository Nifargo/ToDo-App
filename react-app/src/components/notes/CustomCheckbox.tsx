import { type FC, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  readOnly?: boolean;
}

const CustomCheckbox: FC<CustomCheckboxProps> = ({
  checked = false,
  onChange,
  readOnly = false
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleClick = () => {
    if (readOnly) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={readOnly}
      className={cn(
        'checkbox-container group relative mr-3 inline-flex h-6 w-6 shrink-0',
        'cursor-pointer transition-all duration-300 ease-out',
        isPressed && 'scale-90',
        !isPressed && 'scale-100',
        readOnly && 'cursor-default opacity-60'
      )}
    >
      {/* Outer Glow Layer - animates on check */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-500',
          'blur-sm opacity-0',
          isChecked && 'opacity-100 animate-pulse-glow',
          'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500'
        )}
        style={{
          animationDuration: '2s',
        }}
      />

      {/* Circular Container with Holographic Border */}
      <div
        className={cn(
          'checkbox-glass relative h-full w-full rounded-full',
          'border-[2.5px] backdrop-blur-sm transition-all duration-400',
          // Unchecked state - empty circle
          !isChecked && [
            'border-violet-400/40 bg-transparent',
            'group-hover:border-violet-400/70',
            'group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]',
          ],
          // Checked state - filled circle
          isChecked && [
            'border-violet-400/80',
            'shadow-[0_0_25px_rgba(139,92,246,0.6)]',
            'group-hover:border-violet-300',
            'group-hover:shadow-[0_0_35px_rgba(139,92,246,0.8)]',
          ]
        )}
      >
        {/* Shimmer Effect on Hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full opacity-0 transition-opacity duration-300',
            'bg-gradient-to-r from-transparent via-white/30 to-transparent',
            'group-hover:opacity-100 group-hover:animate-shimmer',
            '-translate-x-full'
          )}
        />

        {/* Inner Filled Circle - scales in when checked */}
        <div
          className={cn(
            'absolute inset-[3px] rounded-full overflow-hidden',
            'transition-all duration-500 ease-out',
            isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )}
        >
          {/* Gradient Fill */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
              'animate-gradient-shift'
            )}
          />

          {/* Inner Glow */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/30'
            )}
          />
        </div>
      </div>

      {/* Ripple Effect on Click */}
      {isPressed && (
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-white/20 animate-ripple'
          )}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes draw-check {
          0% {
            stroke-dashoffset: 24;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-draw-check {
          animation: draw-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </button>
  );
};

export default CustomCheckbox;