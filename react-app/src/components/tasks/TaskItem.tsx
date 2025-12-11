import { type FC, useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, Plus, Calendar, Check } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { format, isPast, isToday, startOfDay } from 'date-fns';
import { cn } from '@/utils/cn';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import SubtaskList from './SubtaskList';
import type { Task, Subtask } from '@/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onUpdateSubtasks: (id: string, subtasks: Subtask[]) => void;
}

const TaskItem: FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  onUpdateSubtasks,
}) => {
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if task is due today
  const isDueToday =
    task.dueDate &&
    !task.completed &&
    isToday(new Date(task.dueDate));

  // Check if task is past due (excluding today)
  const isPastDue =
    task.dueDate &&
    !task.completed &&
    isPast(startOfDay(new Date(task.dueDate))) &&
    !isToday(new Date(task.dueDate));

  const handleToggleSubtask = (subtaskId: string): void => {
    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubtasks(task.id, updatedSubtasks);
  };

  const handleDeleteSubtask = (subtaskId: string): void => {
    const updatedSubtasks = (task.subtasks || []).filter(
      (st) => st.id !== subtaskId
    );
    onUpdateSubtasks(task.id, updatedSubtasks);
  };

  const handleAddSubtask = (text: string): void => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      text,
      completed: false,
    };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    onUpdateSubtasks(task.id, updatedSubtasks);
    setIsAddingSubtask(false);
  };

  const handleAddSubtaskClick = (): void => {
    setIsAddingSubtask((prev) => !prev);
  };

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d');
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setIsSwipedOpen(true);
    },
    onSwipedRight: () => {
      setIsSwipedOpen(false);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,  // Enable mouse swipe for testing in browser
    trackTouch: true,
    delta: 10,  // Minimum distance for swipe
  });

  // Close swipe on click outside
  useEffect(() => {
    const handleClickOutside = (event: Event): void => {
      if (
        isSwipedOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSwipedOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSwipedOpen]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Background action buttons (fixed, visible when swiped) */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 transition-opacity duration-300',
          isSwipedOpen ? 'opacity-100 z-0' : 'pointer-events-none opacity-0'
        )}
      >
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            onEdit(task);
            setIsSwipedOpen(false);
          }}
          className="h-full min-h-[80px] rounded-lg bg-blue-500 px-6 text-white shadow-lg hover:bg-blue-600"
          aria-label="Edit task"
        >
          <Edit2 className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            onDelete(task.id);
            setIsSwipedOpen(false);
          }}
          className="h-full min-h-[80px] rounded-lg bg-red-500 px-6 text-white shadow-lg hover:bg-red-600"
          aria-label="Delete task"
        >
          <Trash2 className="h-6 w-6" />
        </Button>
      </div>

      {/* Main card with swipe gesture */}
      <div
        {...handlers}
        className={cn(
          'group holographic-border rounded-xl overflow-hidden',
          'backdrop-blur-2xl border-2 relative z-10 flex',
          task.completed &&
            'bg-gradient-to-br from-slate-500/90 to-slate-600/90 border-slate-400/60 shadow-2xl shadow-slate-500/50',
          isPastDue &&
            'bg-gradient-to-br from-rose-400/95 via-red-500/95 to-pink-600/95 border-red-300/70 shadow-2xl shadow-red-500/60',
          isDueToday &&
            'bg-gradient-to-br from-orange-400/95 via-amber-500/95 to-orange-600/95 border-orange-300/70 shadow-2xl shadow-orange-500/60',
          !isDueToday &&
            !isPastDue &&
            !task.completed &&
            'bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 border-violet-300/70 shadow-2xl shadow-indigo-500/60'
        )}
        style={{
          transform: isSwipedOpen ? 'translateX(-128px)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Left completion area */}
        <button
          onClick={() => onToggle(task.id, !task.completed)}
          className={cn(
            'group/complete w-6 flex items-center justify-center shrink-0 transition-all duration-300 relative',
            'hover:bg-white/10',
            task.completed
              ? 'bg-gradient-to-b from-emerald-500 to-green-600'
              : 'bg-white/5 hover:bg-white/10'
          )}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed ? (
            <Check
              className="h-5 w-5 text-white -rotate-90 transition-transform duration-300"
              strokeWidth={3}
            />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 transition-all duration-300 group-hover/complete:border-white/50 group-hover/complete:scale-110" />
          )}
        </button>

        {/* Main task content */}
        <div className="flex-1 p-4">
          {/* Main task row */}
          <div className="flex items-start gap-3">

          {/* Task content */}
          <div className="min-w-0 flex-1">
            {/* Task text */}
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  'font-geometric break-words text-base font-medium transition-all duration-200',
                  task.completed
                    ? 'text-slate-200 line-through'
                    : 'text-white drop-shadow-lg'
                )}
              >
                {task.text}
              </span>
            </div>

            {/* Task metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Due date badge */}
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm',
                    isPastDue &&
                      'bg-red-600/40 text-white border border-red-300/50',
                    isDueToday &&
                      'bg-orange-600/40 text-white border border-orange-300/50',
                    !isDueToday &&
                      !isPastDue &&
                      'bg-indigo-600/30 text-indigo-50 border border-indigo-300/40'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{formatDueDate(task.dueDate)}</span>
                  {isPastDue && (
                    <span className="ml-1 font-semibold">OVERDUE</span>
                  )}
                  {isDueToday && (
                    <span className="ml-1 font-semibold">DUE TODAY</span>
                  )}
                </div>
              )}

              {/* Subtasks count */}
              {hasSubtasks && (
                <div className="flex items-center gap-1 rounded-full bg-violet-600/30 px-2.5 py-1 text-xs font-semibold text-violet-50 border border-violet-300/40 backdrop-blur-sm">
                  <span>
                    {task.subtasks!.filter((st) => st.completed).length}/
                    {task.subtasks!.length} subtasks
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Add subtask button */}
          <button
            onClick={handleAddSubtaskClick}
            className={cn(
              'group/add-btn relative flex flex-col items-center gap-0.5 shrink-0 rounded-lg border transition-all px-2 py-1.5',
              'border-white/30 bg-white/10 text-white/90',
              'hover:border-white/50 hover:bg-white/20 hover:text-white hover:scale-105',
              isAddingSubtask && 'border-white/60 bg-white/30 text-white shadow-lg scale-105'
            )}
            aria-label="Add subtask"
          >
            <Plus
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isAddingSubtask && 'scale-110'
              )}
            />
            <span className="text-[10px] font-medium leading-none">Sub</span>
            {/* Tooltip hint */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/add-btn:opacity-100 pointer-events-none">
              Add Subtask
            </span>
          </button>
        </div>

        {/* Subtasks section - always visible if exist */}
        {hasSubtasks && (
          <div className="fade-in mt-4 border-t border-white/30 pt-4">
            <div className="space-y-2">
              {task.subtasks!.map((subtask) => (
                <div
                  key={subtask.id}
                  className={cn(
                    'group/subtask fade-in flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-3 transition-all duration-200',
                    'hover:border-white/30 hover:bg-white/15'
                  )}
                >
                  <Checkbox
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="shrink-0"
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm transition-all duration-200',
                      subtask.completed
                        ? 'text-white/50 line-through'
                        : 'text-white/90'
                    )}
                  >
                    {subtask.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className={cn(
                      'h-7 w-7 shrink-0 p-0 text-red-300/70 opacity-0 transition-all',
                      'group-hover/subtask:opacity-100',
                      'hover:bg-red-500/30 hover:text-red-200'
                    )}
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add subtask input section */}
        {isAddingSubtask && (
          <div className="fade-in mt-4 border-t border-white/30 pt-4">
            <SubtaskList
              subtasks={[]}
              onToggle={() => {}}
              onDelete={() => {}}
              onAdd={handleAddSubtask}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;