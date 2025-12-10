import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));

    expect(result.current).toBe('test');
  });

  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    );

    // Initial value should be set
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 100 });

    // Value should still be initial (not debounced yet)
    expect(result.current).toBe('initial');

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 200 }
    );
  });

  it('should use default delay of 300ms if not provided', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    // Should still be initial immediately after update
    expect(result.current).toBe('initial');

    // Wait for debounce to complete (300ms default)
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 500 }
    );
  });

  it('should reset timer on rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    );

    // Rapid updates
    rerender({ value: 'update1', delay: 100 });
    await new Promise((resolve) => setTimeout(resolve, 50));

    rerender({ value: 'update2', delay: 100 });
    await new Promise((resolve) => setTimeout(resolve, 50));

    rerender({ value: 'update3', delay: 100 });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Wait for final debounce
    await waitFor(
      () => {
        expect(result.current).toBe('update3');
      },
      { timeout: 200 }
    );
  });

  it('should handle different types of values', async () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 50),
      { initialProps: { value: 0 } }
    );

    numberRerender({ value: 42 });

    await waitFor(
      () => {
        expect(numberResult.current).toBe(42);
      },
      { timeout: 150 }
    );

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 50),
      { initialProps: { value: false } }
    );

    boolRerender({ value: true });

    await waitFor(
      () => {
        expect(boolResult.current).toBe(true);
      },
      { timeout: 150 }
    );

    // Test with object
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 50),
      { initialProps: { value: { name: 'initial' } } }
    );

    const newObj = { name: 'updated' };
    objectRerender({ value: newObj });

    await waitFor(
      () => {
        expect(objectResult.current).toEqual(newObj);
      },
      { timeout: 150 }
    );
  });

  it('should allow custom delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 200 },
      }
    );

    rerender({ value: 'updated', delay: 200 });

    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // Wait for debounce with custom delay
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 300 }
    );
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() => useDebounce('test', 300));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should handle delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    );

    // Update value and delay
    rerender({ value: 'updated', delay: 150 });

    // Should still be initial
    expect(result.current).toBe('initial');

    // Wait for new delay
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 250 }
    );
  });

  it('should debounce search query use case', async () => {
    const { result, rerender } = renderHook(
      ({ query }) => useDebounce(query, 100),
      {
        initialProps: { query: '' },
      }
    );

    // Simulate fast typing
    rerender({ query: 'h' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    rerender({ query: 'he' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    rerender({ query: 'hel' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    rerender({ query: 'hell' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    rerender({ query: 'hello' });

    // Should still be empty (not debounced yet)
    expect(result.current).toBe('');

    // Wait for debounce
    await waitFor(
      () => {
        expect(result.current).toBe('hello');
      },
      { timeout: 200 }
    );
  });
});