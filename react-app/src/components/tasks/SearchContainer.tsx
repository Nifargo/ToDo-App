import { type FC, type ChangeEvent, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SearchIcon from '@/components/ui/SearchIcon';

interface SearchContainerProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchContainer: FC<SearchContainerProps> = ({
  isOpen,
  searchQuery,
  onSearchChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  const handleClear = (): void => {
    onSearchChange('');
  };

  if (!isOpen) return null;

  return (
    <div className="fade-in mb-4">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl border border-white/20">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Type at least 3 characters to search..."
            leftIcon={<SearchIcon className="h-8 w-8" />}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
            {searchQuery.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className={cn(
                  'fade-in h-8 w-8 rounded-full p-0 text-slate-400',
                  'hover:bg-white/10 hover:text-white'
                )}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="mt-2 text-xs text-slate-300">
            Type at least 3 characters to search
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchContainer;