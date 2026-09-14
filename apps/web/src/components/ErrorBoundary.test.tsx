import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const captureException = vi.fn();
vi.mock('posthog-js', () => ({
  default: { captureException: (...args: unknown[]) => captureException(...args) }
}));

vi.mock('@financeos/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

function Thrower({ error }: { error: Error }): React.ReactElement {
  throw error;
}

function makeChunkError(): Error {
  const error = new Error('Loading chunk 42 failed.');
  error.name = 'ChunkLoadError';
  return error;
}

let reloadMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  captureException.mockClear();
  window.sessionStorage.clear();
  reloadMock = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadMock }
  });
  // React prints the caught error to console; keep the test output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('shows the fallback UI and reports a non-chunk error', () => {
    render(
      <ErrorBoundary>
        <Thrower error={new Error('boom')} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Something went wrong/i)).toBeDefined();
    expect(reloadMock).not.toHaveBeenCalled();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('reloads once on a ChunkLoadError without showing the fallback', () => {
    const { container } = render(
      <ErrorBoundary>
        <Thrower error={makeChunkError()} />
      </ErrorBoundary>
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(captureException).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('financeos:chunk-reload-attempted')).toBe('1');
  });

  it('shows the fallback on a second ChunkLoadError instead of reloading again', () => {
    window.sessionStorage.setItem('financeos:chunk-reload-attempted', '1');

    render(
      <ErrorBoundary>
        <Thrower error={makeChunkError()} />
      </ErrorBoundary>
    );

    expect(reloadMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeDefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('clears the reload flag after a clean load so a later deploy can recover', () => {
    window.sessionStorage.setItem('financeos:chunk-reload-attempted', '1');

    render(
      <ErrorBoundary>
        <div>healthy</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('healthy')).toBeDefined();
    expect(window.sessionStorage.getItem('financeos:chunk-reload-attempted')).toBeNull();
  });
});
