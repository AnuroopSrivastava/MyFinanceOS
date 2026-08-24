import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
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

  describe('Exported Components', () => {
    it('should export all newly extracted core UI components', async () => {
      const ui = await import('./index.js');
      expect(ui.RadialGauge).toBeDefined();
      expect(ui.Accordion).toBeDefined();
      expect(ui.QuickstartGuide).toBeDefined();
      expect(ui.SearchFilterBar).toBeDefined();
      expect(ui.Badge).toBeDefined();
      expect(ui.StatusBadge).toBeDefined();
      expect(ui.Tabs).toBeDefined();
      expect(ui.MetricCard).toBeDefined();
      expect(ui.SectionHeader).toBeDefined();
      expect(ui.TimelineSegmentedFilter).toBeDefined();
      expect(ui.DateRangePicker).toBeDefined();
      expect(ui.SummaryMetricGrid).toBeDefined();
      expect(ui.FileDropzone).toBeDefined();
      expect(ui.PaginationControls).toBeDefined();
      expect(ui.CopyableField).toBeDefined();
      expect(ui.FormRow).toBeDefined();
    });
  });
});
