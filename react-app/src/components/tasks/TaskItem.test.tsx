import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TaskItem from './TaskItem';
import type { Task } from '@/types';

const mockTask: Task = {
  id: '1',
  text: 'Test Task',
  completed: false,
  createdAt: new Date().toISOString(),
  userId: 'user-123',
};

const mockTaskWithSubtasks: Task = {
  id: '2',
  text: 'Task with Subtasks',
  completed: false,
  createdAt: new Date().toISOString(),
  userId: 'user-123',
  subtasks: [
    { id: 'sub-1', text: 'Subtask 1', completed: false },
    { id: 'sub-2', text: 'Subtask 2', completed: true },
  ],
};

describe('TaskItem', () => {
  it('should render task text', () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', async () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    // TaskItem uses a custom button for completion, not a checkbox
    const completeButton = screen.getByLabelText('Mark as complete');
    await userEvent.click(completeButton);

    expect(mockOnToggle).toHaveBeenCalledWith('1', true);
  });

  it('should display subtasks when task has subtasks', () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTaskWithSubtasks}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
  });

  it('should show add subtask button', () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    const addButton = screen.getByLabelText('Add subtask');
    expect(addButton).toBeInTheDocument();
  });

  it('should toggle add subtask form when plus button is clicked', async () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    const addButton = screen.getByLabelText('Add subtask');
    await userEvent.click(addButton);

    // SubtaskList input should appear
    const input = screen.getByPlaceholderText('Add first subtask...');
    expect(input).toBeInTheDocument();
  });

  it('should display subtasks count badge', () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={mockTaskWithSubtasks}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    expect(screen.getByText('1/2 subtasks')).toBeInTheDocument();
  });

  it('should apply completed styles when task is completed', () => {
    const completedTask: Task = { ...mockTask, completed: true };
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={completedTask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    const taskText = screen.getByText('Test Task');
    expect(taskText).toHaveClass('line-through');
  });

  it('should display due date when task has dueDate', () => {
    const taskWithDate: Task = {
      ...mockTask,
      dueDate: new Date('2025-12-25').toISOString(),
    };
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnUpdateSubtasks = vi.fn();

    render(
      <TaskItem
        task={taskWithDate}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        onUpdateSubtasks={mockOnUpdateSubtasks}
      />
    );

    expect(screen.getByText('Dec 25')).toBeInTheDocument();
  });
});