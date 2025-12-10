import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFirestore } from '../useFirestore';
import { updateDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'test-doc' })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() =>
    Promise.resolve({
      docs: [],
    })
  ),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => false,
      id: 'test-doc',
      data: () => ({}),
    })
  ),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  where: vi.fn(),
}));

interface TestData {
  id: string;
  text: string;
  completed: boolean;
}

describe('useFirestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('update function', () => {
    it('should update document with correct data format', async () => {
      const { result } = renderHook(() =>
        useFirestore<TestData>('tasks', [], false)
      );

      const updateData = { completed: true };
      const docId = 'task-123';

      await result.current.update(docId, updateData);

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
      });

      // Verify updateDoc was called with correct arguments
      const updateDocCall = vi.mocked(updateDoc).mock.calls[0];
      expect(updateDocCall[0]).toEqual({ id: 'test-doc' });

      // Verify the data object contains both updateData and updatedAt
      const updatedData = updateDocCall[1] as unknown as Record<string, unknown>;
      expect(updatedData).toHaveProperty('completed', true);
      expect(updatedData).toHaveProperty('updatedAt');
      expect(typeof updatedData.updatedAt).toBe('string');
    });

    it('should throw error for invalid document ID', async () => {
      const { result } = renderHook(() =>
        useFirestore<TestData>('tasks', [], false)
      );

      await expect(result.current.update('', { completed: true })).rejects.toThrow(
        'Invalid document ID'
      );
    });

    it('should handle multiple field updates', async () => {
      const { result } = renderHook(() =>
        useFirestore<TestData>('tasks', [], false)
      );

      const updateData = {
        text: 'Updated text',
        completed: true,
      };
      const docId = 'task-123';

      await result.current.update(docId, updateData);

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
      });

      const updateDocCall = vi.mocked(updateDoc).mock.calls[0];
      const updatedData = updateDocCall[1];

      expect(updatedData).toHaveProperty('text', 'Updated text');
      expect(updatedData).toHaveProperty('completed', true);
      expect(updatedData).toHaveProperty('updatedAt');
    });
  });
});