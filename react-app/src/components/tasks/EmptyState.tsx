import { type FC } from 'react';
import type { TaskFilter } from '@/types';

interface EmptyStateProps {
  filter: TaskFilter;
  searchQuery?: string;
}

const EmptyState: FC<EmptyStateProps> = ({ filter, searchQuery }) => {
  const getEmptyMessage = (): string => {
    if (searchQuery && searchQuery.length >= 3) {
      return 'No tasks found matching your search';
    }

    switch (filter) {
      case 'today':
        return 'No tasks for today';
      case 'month':
        return 'No tasks for this month';
      case 'completed':
        return 'No completed tasks yet';
      case 'all':
      default:
        return 'No tasks yet';
    }
  };

  const getEmptyIcon = (): string => {
    if (searchQuery && searchQuery.length >= 3) {
      return '🔍';
    }

    switch (filter) {
      case 'today':
        return '📅';
      case 'month':
        return '📆';
      case 'completed':
        return '✅';
      case 'all':
      default:
        return '✨';
    }
  };

  return (
    <div className="fade-in flex min-h-[300px] flex-col items-center justify-center rounded-2xl p-8 text-center bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 backdrop-blur-2xl border-2 border-violet-300/70 shadow-2xl shadow-indigo-500/60">
      <div className="mb-6 text-6xl drop-shadow-2xl">{getEmptyIcon()}</div>
      <h3 className="font-geometric mb-3 text-2xl font-bold text-white drop-shadow-lg">
        {getEmptyMessage()}
      </h3>
      <p className="text-white/90 font-medium">
        {searchQuery && searchQuery.length >= 3
          ? 'Try a different search term'
          : 'Click the + button to create your first task'}
      </p>
    </div>
  );
};

export default EmptyState;