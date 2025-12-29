import { type FC } from 'react';
import { CheckSquare, ClipboardList, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

export type NavItem = 'tasks' | 'list' | 'settings';

export interface BottomNavProps {
  activeItem?: NavItem;
  onItemClick?: (item: NavItem) => void;
  className?: string;
}

interface NavItemConfig {
  id: NavItem;
  label: string;
  icon: typeof CheckSquare;
}

const navItems: NavItemConfig[] = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'list', label: 'Notes', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const BottomNav: FC<BottomNavProps> = ({
  activeItem = 'tasks',
  onItemClick,
  className,
}) => {
  return (
    <nav
      className={cn(
        'glass-card fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/50',
        'px-2 md:hidden',
        className
      )}
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeItem === id;

          return (
            <button
              key={id}
              onClick={() => onItemClick?.(id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-200',
                'rounded-lg',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium transition-all',
                  isActive && 'font-semibold'
                )}
              >
                {label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 h-1 w-12 rounded-t-full bg-primary animate-scale-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;