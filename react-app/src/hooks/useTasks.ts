import { useMutation, useQueryClient } from '@tanstack/react-query';
import { where } from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from '@/types';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  createTask: (data: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useTasks(filter: TaskFilter = 'all'): UseTasksResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Build query constraints based on filter
  const getConstraints = () => {
    if (!user) return [];

    const constraints = [where('userId', '==', user.uid)];

    const now = new Date();

    switch (filter) {
      case 'today':
        constraints.push(
          where('dueDate', '>=', startOfDay(now).toISOString()),
          where('dueDate', '<=', endOfDay(now).toISOString())
        );
        break;
      case 'month':
        constraints.push(
          where('dueDate', '>=', startOfMonth(now).toISOString()),
          where('dueDate', '<=', endOfMonth(now).toISOString())
        );
        break;
      case 'completed':
        constraints.push(where('completed', '==', true));
        break;
      case 'all':
      default:
        // No additional constraints
        break;
    }

    return constraints;
  };

  const constraints = getConstraints();

  const {
    data: tasks,
    loading,
    error,
    create,
    update,
    remove,
  } = useFirestore<Task>('tasks', constraints, true);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      if (!user) throw new Error('User not authenticated');

      const newTaskData = {
        text: data.text,
        completed: false,
        dueDate: data.dueDate || null,
        userId: user.uid,
        subtasks: data.subtasks || [],
      };

      const createdId = await create(newTaskData);
      return createdId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      await update(id, data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Toggle complete helper
  const toggleComplete = async (id: string, completed: boolean): Promise<void> => {
    await updateMutation.mutateAsync({ id, data: { completed } });
  };

  return {
    tasks: tasks || [],
    loading,
    error,
    createTask: async (data: CreateTaskInput) => {
      await createMutation.mutateAsync(data);
    },
    updateTask: async (id: string, data: UpdateTaskInput) => {
      await updateMutation.mutateAsync({ id, data });
    },
    deleteTask: async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    toggleComplete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}