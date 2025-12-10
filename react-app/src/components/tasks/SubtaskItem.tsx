import { type FC } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import type { Subtask } from '@/types';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubtaskItem: FC<SubtaskItemProps> = ({ subtask, onToggle, onDelete }) => {
  return (
    <div
      className={cn(
        'group fade-in flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200',
        'hover:border-gray-300 hover:bg-white hover:shadow-sm'
      )}
    >
      <Checkbox
        checked={subtask.completed}
        onChange={() => onToggle(subtask.id)}
        className="shrink-0"
      />
      <span
        className={cn(
          'flex-1 text-sm transition-all duration-200',
          subtask.completed
            ? 'text-gray-400 line-through'
            : 'text-gray-700'
        )}
      >
        {subtask.text}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(subtask.id)}
        className={cn(
          'h-8 w-8 shrink-0 p-0 text-red-500 opacity-0 transition-opacity',
          'group-hover:opacity-100',
          'hover:bg-red-50 hover:text-red-600'
        )}
        aria-label="Delete subtask"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SubtaskItem;