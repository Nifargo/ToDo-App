import { type FC, useState, useRef, useEffect } from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TextStyle } from '@/types';
import { styleOptions } from '@/utils/styleOptions';

interface StyleDropdownProps {
  onStyleSelect: (style: TextStyle) => void;
}

const iconComponents = {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
};

const StyleDropdown: FC<StyleDropdownProps> = ({ onStyleSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStyleClick = (styleId: TextStyle) => {
    onStyleSelect(styleId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'group relative overflow-hidden rounded-lg p-2 transition-all duration-300',
          'bg-white/5 hover:bg-white/10',
          'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-500/20 before:to-pink-500/20 before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-100',
          isOpen && 'bg-white/10 before:opacity-100'
        )}
        aria-label="Choose text style"
      >
        <Type className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl',
            'border border-white/10 bg-black/80 backdrop-blur-xl',
            'shadow-2xl shadow-purple-500/20',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          <div className="p-2">
            {styleOptions.map((option) => {
              const IconComponent =
                iconComponents[option.icon as keyof typeof iconComponents];

              return (
                <button
                  key={option.id}
                  onClick={() => handleStyleClick(option.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                    'hover:bg-white/10',
                    'relative overflow-hidden',
                    'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-500/10 before:to-pink-500/10 before:opacity-0 before:transition-opacity',
                    'hover:before:opacity-100'
                  )}
                >
                  <IconComponent className="h-4 w-4 text-purple-300 transition-transform group-hover:scale-110" />

                  <span className="flex-1 text-left text-sm font-medium text-white">
                    {option.label}
                  </span>

                  {option.shortcut && (
                    <span className="text-xs text-white/40">
                      {option.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleDropdown;