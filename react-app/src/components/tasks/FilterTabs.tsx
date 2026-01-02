import { type FC } from 'react';
import { cn } from '@/utils/cn';
import type { TaskFilter } from '@/types';

interface FilterTabsProps {
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

interface FilterTab {
  key: TaskFilter;
  label: string;
}

const filters: FilterTab[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'Month' },
];

const FilterTabs: FC<FilterTabsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="flex gap-2 rounded-2xl p-2 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-xl border border-white/20">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            'font-geometric flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            activeFilter === filter.key
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-200 hover:bg-white/10 hover:text-white'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;