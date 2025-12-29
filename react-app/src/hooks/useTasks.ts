import { useMutation, useQueryClient } from '@tanstack/react-query';
import { where } from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';
import { useMemo, useCallback, useEffect } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilter } from '@/types';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, isWithinInterval, differenceInHours } from 'date-fns';

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

  // LocalStorage for guest users
  const [localTasks, setLocalTasks] = useLocalStorage<Task[]>('guest_tasks', []);

  // Firebase for authenticated users
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
        break;
    }

    return constraints;
  };

  const constraints = getConstraints();
  const {
    data: firebaseTasks,
    loading: firebaseLoading,
    error: firebaseError,
    create,
    update,
    remove,
  } = useFirestore<Task>('tasks', constraints, user !== null);

  // Filter local tasks based on filter
  const filteredLocalTasks = useMemo(() => {
    if (user) return []; // Use Firebase when logged in

    const now = new Date();
    return localTasks.filter(task => {
      switch (filter) {
        case 'today':
          return task.dueDate && isWithinInterval(new Date(task.dueDate), {
            start: startOfDay(now),
            end: endOfDay(now)
          });
        case 'month':
          return task.dueDate && isWithinInterval(new Date(task.dueDate), {
            start: startOfMonth(now),
            end: endOfMonth(now)
          });
        case 'completed':
          return task.completed === true;
        case 'all':
        default:
          return true;
      }
    });
  }, [localTasks, filter, user]);

  // Local task operations
  const createLocalTask = useCallback(async (data: CreateTaskInput) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text: data.text,
      completed: false,
      dueDate: data.dueDate,
      subtasks: data.subtasks?.map((st, index) => ({
        ...st,
        id: `${Date.now()}-${index}`,
      })),
      userId: 'guest',
      createdAt: new Date().toISOString(),
    };
    setLocalTasks(prev => [...prev, newTask]);
  }, [setLocalTasks]);

  const updateLocalTask = useCallback(async (id: string, data: UpdateTaskInput) => {
    setLocalTasks(prev => prev.map(task =>
      task.id === id
        ? { ...task, ...data, updatedAt: new Date().toISOString() }
        : task
    ));
  }, [setLocalTasks]);

  const deleteLocalTask = useCallback(async (id: string) => {
    setLocalTasks(prev => prev.filter(task => task.id !== id));
  }, [setLocalTasks]);

  // Firebase task operations
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

      return await create(newTaskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      await update(id, data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Unified operations
  const createTask = async (data: CreateTaskInput): Promise<void> => {
    if (user) {
      await createMutation.mutateAsync(data);
    } else {
      await createLocalTask(data);
    }
  };

  const updateTask = async (id: string, data: UpdateTaskInput): Promise<void> => {
    if (user) {
      await updateMutation.mutateAsync({ id, data });
    } else {
      await updateLocalTask(id, data);
    }
  };

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    if (user) {
      await deleteMutation.mutateAsync(id);
    } else {
      await deleteLocalTask(id);
    }
  }, [user, deleteMutation, deleteLocalTask]);

  const toggleComplete = async (id: string, completed: boolean): Promise<void> => {
    const updateData: UpdateTaskInput = {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    };
    await updateTask(id, updateData);
  };

  // Cleanup old completed tasks (older than 8 hours)
  const cleanupOldCompletedTasks = useCallback(async () => {
    const now = new Date();
    const HOURS_BEFORE_DELETE = 8;

    if (user) {
      // Firebase: find and delete old completed tasks
      const tasksToDelete = (firebaseTasks || []).filter(task => {
        if (!task.completed || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return differenceInHours(now, completedDate) >= HOURS_BEFORE_DELETE;
      });

      for (const task of tasksToDelete) {
        await deleteTask(task.id);
      }
    } else {
      // LocalStorage: filter out old completed tasks
      setLocalTasks(prev => prev.filter(task => {
        if (!task.completed || !task.completedAt) return true;
        const completedDate = new Date(task.completedAt);
        return differenceInHours(now, completedDate) < HOURS_BEFORE_DELETE;
      }));
    }
  }, [user, firebaseTasks, deleteTask, setLocalTasks]);

  // Run cleanup on mount and every hour
  useEffect(() => {
    cleanupOldCompletedTasks();

    // Run cleanup every hour
    const intervalId = setInterval(cleanupOldCompletedTasks, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  return {
    tasks: user ? (firebaseTasks || []) : filteredLocalTasks,
    loading: user ? firebaseLoading : false,
    error: user ? firebaseError : null,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    isCreating: user ? createMutation.isPending : false,
    isUpdating: user ? updateMutation.isPending : false,
    isDeleting: user ? deleteMutation.isPending : false,
  };
}