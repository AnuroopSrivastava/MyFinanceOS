import { describe, it, expect, vi } from 'vitest';
import { exportToCSV } from './exportCsv.js';

describe('exportToCSV utility', () => {
  it('should generate valid CSV blob and trigger download', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn()
    };
    
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') return mockLink as any;
      return origCreateElement(tagName);
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
    vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

    const data = [
      { id: '1', name: 'Salary', amount: 50000 },
      { id: '2', name: 'Rent', amount: 15000 }
    ];

    exportToCSV('test_ledger', [
      { label: 'ID', key: 'id' },
      { label: 'Category Name', key: 'name' },
      { label: 'Amount (INR)', key: 'amount' }
    ], data);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
