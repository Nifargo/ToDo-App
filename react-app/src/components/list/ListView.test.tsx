import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ListView from './ListView';
import type { Task } from '@/types';

describe('ListView', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      text: 'Test Task 1',
      completed: false,
      createdAt: new Date().toISOString(),
      userId: 'user1',
      dueDate: new Date().toISOString(),
    },
    {
      id: '2',
      text: 'Test Task 2',
      completed: true,
      createdAt: new Date().toISOString(),
      userId: 'user1',
    },
    {
      id: '3',
      text: 'Overdue Task',
      completed: false,
      createdAt: new Date().toISOString(),
      userId: 'user1',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
  ];

  const mockOnToggleTask = vi.fn();
  const mockOnTaskClick = vi.fn();

  it('should render loading state', () => {
    render(
      <ListView
        tasks={[]}
        loading={true}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
  });

  it('should render empty state when no tasks', () => {
    render(
      <ListView
        tasks={[]}
        loading={false}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('should render all tasks', () => {
    render(
      <ListView
        tasks={mockTasks}
        loading={false}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Overdue Task')).toBeInTheDocument();
  });

  it('should call onToggleTask when clicking checkbox', () => {
    render(
      <ListView
        tasks={mockTasks}
        loading={false}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    const checkboxes = screen.getAllByRole('button', { name: /mark as/i });
    fireEvent.click(checkboxes[0]);

    expect(mockOnToggleTask).toHaveBeenCalled();
  });

  it('should call onTaskClick when clicking task', () => {
    render(
      <ListView
        tasks={mockTasks}
        loading={false}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    const taskButton = screen.getByText('Test Task 1').closest('button');
    if (taskButton) {
      fireEvent.click(taskButton);
      expect(mockOnTaskClick).toHaveBeenCalled();
    }
  });

  it('should display task summary statistics', () => {
    render(
      <ListView
        tasks={mockTasks}
        loading={false}
        onToggleTask={mockOnToggleTask}
        onTaskClick={mockOnTaskClick}
      />
    );

    expect(screen.getByText(/3 total/i)).toBeInTheDocument();
    expect(screen.getByText(/2 active/i)).toBeInTheDocument();
  });
});