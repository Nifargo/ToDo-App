import { type FC, useState, type FormEvent, type ChangeEvent } from 'react';
import { Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Task, CreateTaskInput } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput) => Promise<void>;
  editingTask?: Task | null;
  isSaving?: boolean;
}

const TaskModal: FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask = null,
  isSaving = false,
}) => {
  const [taskText, setTaskText] = useState(editingTask?.text || '');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || '');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const trimmedText = taskText.trim();
    if (!trimmedText) {
      return;
    }

    const taskData: CreateTaskInput = {
      text: trimmedText,
      dueDate: dueDate || undefined,
    };

    try {
      await onSave(taskData);
      handleClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleClose = (): void => {
    setTaskText('');
    setDueDate('');
    onClose();
  };

  const handleTaskTextChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTaskText(e.target.value);
  };

  const handleDueDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDueDate(e.target.value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingTask ? 'Edit Task' : 'New Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
        {/* Task name input */}
        <div className="w-full">
          <Input
            type="text"
            value={taskText}
            onChange={handleTaskTextChange}
            placeholder="Enter task name..."
            autoFocus
            disabled={isSaving}
            required
          />
        </div>

        {/* Due date input */}
        <div className="w-full">
          <label
            htmlFor="dueDate"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Due date (optional)
          </label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
            leftIcon={<Calendar className="h-5 w-5" />}
            disabled={isSaving}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            disabled={!taskText.trim() || isSaving}
            fullWidth
          >
            {editingTask ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;