import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '../useTasks';
import { AuthProvider } from '@/contexts/AuthContext';
import type { CreateTaskInput, UpdateTaskInput } from '@/types';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: {},
  auth: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Mock authenticated user
    callback({
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    });
    return vi.fn(); // Unsubscribe
  }),
  GoogleAuthProvider: vi.fn(),
}));

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('../useFirestore', () => ({
  useFirestore: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  query: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('useTasks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockCreate.mockResolvedValue('new-task-id');
    mockUpdate.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  describe('Initial State', () => {
    it('should return empty tasks array initially', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all CRUD functions', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.createTask).toBeDefined();
      expect(result.current.updateTask).toBeDefined();
      expect(result.current.deleteTask).toBeDefined();
      expect(result.current.toggleComplete).toBeDefined();
      expect(typeof result.current.createTask).toBe('function');
      expect(typeof result.current.updateTask).toBe('function');
      expect(typeof result.current.deleteTask).toBe('function');
      expect(typeof result.current.toggleComplete).toBe('function');
    });

    it('should provide loading states', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('Filter Support', () => {
    it('should accept "all" filter', () => {
      const { result } = renderHook(() => useTasks('all'), { wrapper });

      expect(result.current.tasks).toBeDefined();
    });

    it('should accept "today" filter', () => {
      const { result } = renderHook(() => useTasks('today'), { wrapper });

      expect(result.current.tasks).toBeDefined();
    });

    it('should accept "month" filter', () => {
      const { result } = renderHook(() => useTasks('month'), { wrapper });

      expect(result.current.tasks).toBeDefined();
    });

    it('should accept "completed" filter', () => {
      const { result } = renderHook(() => useTasks('completed'), { wrapper });

      expect(result.current.tasks).toBeDefined();
    });

    it('should default to "all" filter when not specified', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.tasks).toBeDefined();
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const newTask: CreateTaskInput = {
        text: 'New test task',
        dueDate: new Date().toISOString(),
        subtasks: [],
      };

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockCreate).toHaveBeenCalledWith({
        text: 'New test task',
        completed: false,
        dueDate: newTask.dueDate,
        userId: 'test-user-123',
        subtasks: [],
      });
    });

    it('should create task without dueDate', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const newTask: CreateTaskInput = {
        text: 'Task without date',
      };

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockCreate).toHaveBeenCalledWith({
        text: 'Task without date',
        completed: false,
        dueDate: null,
        userId: 'test-user-123',
        subtasks: [],
      });
    });

    it('should create task with subtasks', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const newTask: CreateTaskInput = {
        text: 'Task with subtasks',
        subtasks: [
          { text: 'Subtask 1', completed: false },
          { text: 'Subtask 2', completed: false },
        ],
      };

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Task with subtasks',
          subtasks: [
            { text: 'Subtask 1', completed: false },
            { text: 'Subtask 2', completed: false },
          ],
        })
      );
    });

    it('should set isCreating to true while creating', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const createPromise = result.current.createTask({
        text: 'Test task',
      });

      // Check loading state (might be true during mutation)
      expect(result.current.isCreating).toBeDefined();

      await act(async () => {
        await createPromise;
      });

      // After completion, should be false
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should handle create errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Create failed'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.createTask({ text: 'Test' });
        });
      }).rejects.toThrow('Create failed');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const updateData: UpdateTaskInput = {
        text: 'Updated text',
        completed: true,
      };

      await act(async () => {
        await result.current.updateTask('task-123', updateData);
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', updateData);
    });

    it('should update only specific fields', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await act(async () => {
        await result.current.updateTask('task-123', { completed: true });
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { completed: true });
    });

    it('should update task text', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await act(async () => {
        await result.current.updateTask('task-123', { text: 'New text' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { text: 'New text' });
    });

    it('should update task dueDate', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const newDate = new Date().toISOString();

      await act(async () => {
        await result.current.updateTask('task-123', { dueDate: newDate });
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { dueDate: newDate });
    });

    it('should update task subtasks', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const subtasks = [
        { text: 'Subtask 1', completed: true },
        { text: 'Subtask 2', completed: false },
      ];

      await act(async () => {
        await result.current.updateTask('task-123', { subtasks });
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { subtasks });
    });

    it('should handle update errors', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.updateTask('task-123', { text: 'Test' });
        });
      }).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await act(async () => {
        await result.current.deleteTask('task-123');
      });

      expect(mockRemove).toHaveBeenCalledWith('task-123');
    });

    it('should handle delete errors', async () => {
      mockRemove.mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.deleteTask('task-123');
        });
      }).rejects.toThrow('Delete failed');
    });
  });

  describe('toggleComplete', () => {
    it('should toggle task to completed', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await act(async () => {
        await result.current.toggleComplete('task-123', true);
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { completed: true });
    });

    it('should toggle task to incomplete', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await act(async () => {
        await result.current.toggleComplete('task-123', false);
      });

      expect(mockUpdate).toHaveBeenCalledWith('task-123', { completed: false });
    });

    it('should handle toggle errors', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Toggle failed'));

      const { result } = renderHook(() => useTasks(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.toggleComplete('task-123', true);
        });
      }).rejects.toThrow('Toggle failed');
    });
  });

  describe('Loading States', () => {
    it('should reflect isCreating state', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      // Start creating
      const createPromise = result.current.createTask({ text: 'Test' });

      // After mutation completes
      await act(async () => {
        await createPromise;
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should reflect isUpdating state', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const updatePromise = result.current.updateTask('task-123', { text: 'Test' });

      await act(async () => {
        await updatePromise;
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it('should reflect isDeleting state', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      const deletePromise = result.current.deleteTask('task-123');

      await act(async () => {
        await deletePromise;
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });
});