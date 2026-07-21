import { describe, it, expect } from 'vitest';
import { filterByDateRange, GlobalDateRange } from './dateFilter';

describe('Date Filter Utility', () => {
  const mockData = [
    { id: 1, date: '2023-01-01' },
    { id: 2, date: '2023-05-15' },
    { id: 3, date: '2023-12-31' },
    { id: 4, date: '2024-01-01' },
  ];

  it('should return all items if no dates are provided (All Time)', () => {
    const range: GlobalDateRange = { startDate: null, endDate: null, label: 'All Time' };
    const result = filterByDateRange(mockData, range, item => item.date);
    expect(result).toHaveLength(4);
  });

  it('should filter items within start and end date', () => {
    const range: GlobalDateRange = { startDate: '2023-02-01', endDate: '2023-12-31', label: 'Custom' };
    const result = filterByDateRange(mockData, range, item => item.date);
    expect(result).toHaveLength(2); // IDs 2 and 3
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(3);
  });

  it('should filter items strictly after start date (no end date)', () => {
    const range: GlobalDateRange = { startDate: '2023-06-01', endDate: null, label: 'Custom' };
    const result = filterByDateRange(mockData, range, item => item.date);
    expect(result).toHaveLength(2); // IDs 3 and 4
  });

  it('should filter items strictly before end date (no start date)', () => {
    const range: GlobalDateRange = { startDate: null, endDate: '2023-06-01', label: 'Custom' };
    const result = filterByDateRange(mockData, range, item => item.date);
    expect(result).toHaveLength(2); // IDs 1 and 2
  });

  it('should handle invalid item dates gracefully', () => {
    const dirtyData = [...mockData, { id: 5, date: 'invalid-date' }, { id: 6, date: '' }];
    const range: GlobalDateRange = { startDate: '2023-01-01', endDate: '2024-01-01', label: 'Custom' };
    const result = filterByDateRange(dirtyData, range, item => item.date);
    expect(result).toHaveLength(4); // Excludes invalid dates
  });
});
