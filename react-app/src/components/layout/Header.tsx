import { type FC } from 'react';
import { CheckSquare, Menu } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface HeaderProps {
  className?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

const Header: FC<HeaderProps> = ({
  className,
  showMenu = false,
  onMenuClick,
}) => {
  return (
    <header
      className={cn(
        'glass-card sticky top-0 z-40 border-b border-gray-200/50',
        'px-4 py-3 md:px-6',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-liquid">
            <CheckSquare className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900">
              {import.meta.env.VITE_APP_NAME || 'My Tasks'}
            </h1>
            <p className="text-xs text-gray-500">
              Stay organized, stay productive
            </p>
          </div>
        </div>

        {/* Right side - User menu placeholder */}
        <div className="flex items-center gap-2">
          {showMenu && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Placeholder for user profile */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;