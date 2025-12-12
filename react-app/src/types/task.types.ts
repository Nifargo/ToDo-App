// Task types for Firestore

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string; // Timestamp when task was marked as completed
  dueDate?: string;
  createdAt: string;
  userId: string;
  subtasks?: Subtask[];
}

export interface CreateTaskInput {
  text: string;
  dueDate?: string;
  subtasks?: Omit<Subtask, 'id'>[];
}

export interface UpdateTaskInput {
  text?: string;
  completed?: boolean;
  completedAt?: string;
  dueDate?: string;
  subtasks?: Subtask[];
}

export type TaskFilter = 'all' | 'today' | 'month' | 'completed';