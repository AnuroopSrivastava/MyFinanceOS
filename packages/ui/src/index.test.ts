import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { setTheme, getSavedTheme } from './index.js';

beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn()
    },
    writable: true
  });
  
  // Mock document
  Object.defineProperty(globalThis, 'document', {
    value: {
      documentElement: {
        setAttribute: vi.fn()
      }
    },
    writable: true
  });
});

describe('UI Theme Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setTheme', () => {
    it('should set data-theme attribute on document root', () => {
      setTheme('glass-emerald');
      expect(globalThis.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'glass-emerald');
    });

    it('should persist theme to localStorage', () => {
      setTheme('dark');
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('financeos-theme', 'dark');
    });
  });

  describe('getSavedTheme', () => {
    it('should return saved theme from localStorage', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue('light');
      const theme = getSavedTheme();
      expect(theme).toBe('light');
    });

    it('should default to glass-cyan if nothing is saved', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);
      const theme = getSavedTheme();
      expect(theme).toBe('glass-cyan');
    });
  });
});
