import { type FC, useMemo } from 'react';
import { isPast, isToday, startOfDay } from 'date-fns';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Task, TaskFilter, Subtask } from '@/types';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  filter: TaskFilter;
  searchQuery: string;
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateSubtasks: (id: string, subtasks: Subtask[]) => void;
}

const TaskList: FC<TaskListProps> = ({
  tasks,
  loading,
  filter,
  searchQuery,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onUpdateSubtasks,
}) => {
  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply search filter (min 3 characters)
    if (searchQuery.length >= 3) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((task) =>
        task.text.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort tasks:
    // 1. Overdue tasks first (red)
    // 2. Incomplete tasks
    // 3. Completed tasks last
    filtered.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Among incomplete tasks, overdue tasks come first
      if (!a.completed && !b.completed) {
        const aIsOverdue =
          a.dueDate &&
          isPast(startOfDay(new Date(a.dueDate))) &&
          !isToday(new Date(a.dueDate));
        const bIsOverdue =
          b.dueDate &&
          isPast(startOfDay(new Date(b.dueDate))) &&
          !isToday(new Date(b.dueDate));

        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
      }

      // Sort by due date if both have one
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // Tasks without due date go after tasks with due date
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Otherwise, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [tasks, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  if (filteredAndSortedTasks.length === 0) {
    return <EmptyState filter={filter} searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-3">
      {filteredAndSortedTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
          onUpdateSubtasks={onUpdateSubtasks}
        />
      ))}
    </div>
  );
};

export default TaskList;