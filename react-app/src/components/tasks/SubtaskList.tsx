import { type FC, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Plus } from 'lucide-react';
import SubtaskItem from './SubtaskItem';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Subtask } from '@/types';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string) => void;
}

const SubtaskList: FC<SubtaskListProps> = ({
  subtasks,
  onToggle,
  onDelete,
  onAdd,
}) => {
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAdd = (): void => {
    const trimmedText = newSubtaskText.trim();
    if (trimmedText) {
      onAdd(trimmedText);
      setNewSubtaskText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNewSubtaskText(e.target.value);
  };

  // Calculate progress
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2">
          <span className="text-sm font-medium text-gray-600">
            {completedSubtasks}/{totalSubtasks}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {progressPercent}%
          </span>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Add new subtask input */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newSubtaskText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            subtasks.length === 0
              ? 'Add first subtask...'
              : 'Add subtask...'
          }
          className="flex-1"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleAdd}
          disabled={!newSubtaskText.trim()}
          className="shrink-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SubtaskList;