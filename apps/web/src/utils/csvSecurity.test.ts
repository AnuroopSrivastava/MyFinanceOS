import { describe, it, expect } from 'vitest';
import { exportToCSV, CsvExportError } from './exportCsv';

// Helper: capture the last blob content written via URL.createObjectURL
function captureLastCsvExport(
  filename: string,
  headers: { label: string; key: string }[],
  data: Record<string, unknown>[]
): string {
  let capturedContent = '';
  const origCreateObjectURL = URL.createObjectURL;
  const origCreateElement = document.createElement.bind(document);

  // Intercept blob creation
  URL.createObjectURL = (blob: Blob) => {
    const reader = new FileReader();
    const result = (blob as unknown as { _content?: string });
    // We'll use synchronous approach via captured content
    return 'blob:mock';
  };

  // Intercept Blob to capture content
  const origBlob = global.Blob;
  global.Blob = class MockBlob extends Blob {
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      capturedContent = parts.join('');
    }
  } as typeof Blob;

  // Intercept click
  const origAppendChild = document.body.appendChild.bind(document.body);
  const origRemoveChild = document.body.removeChild.bind(document.body);
  document.body.appendChild = (el: Node) => el;
  document.body.removeChild = (el: Node) => el;

  const mockLink = { setAttribute: () => {}, click: () => {} } as unknown as HTMLAnchorElement;
  const origCreateElem = document.createElement;
  document.createElement = ((tag: string) => {
    if (tag === 'a') return mockLink;
    return origCreateElem.call(document, tag);
  }) as typeof document.createElement;

  try {
    exportToCSV(filename, headers as { label: string; key: keyof typeof data[0] }[], data);
  } finally {
    URL.createObjectURL = origCreateObjectURL;
    global.Blob = origBlob;
    document.body.appendChild = origAppendChild;
    document.body.removeChild = origRemoveChild;
    document.createElement = origCreateElem;
  }

  return capturedContent;
}

describe('CSV Export — Security (BUG-002 Prevention)', () => {
  const headers = [{ label: 'Name', key: 'name' }, { label: 'Amount', key: 'amount' }, { label: 'Description', key: 'desc' }];

  describe('CSV Injection Prevention', () => {
    it('should neutralize = prefix (formula injection)', () => {
      const data = [{ name: 'Safe User', amount: 100, desc: '=SUM(A1:A100)' }];
      const csv = captureLastCsvExport('test', headers, data);
      // The dangerous = prefix must be replaced/neutralized
      expect(csv).not.toContain('"=SUM(A1:A100)"'); // Must NOT appear verbatim
      expect(csv).toContain('\t=SUM(A1:A100)'); // Must be prefixed with tab
    });

    it('should neutralize + prefix (command injection)', () => {
      const data = [{ name: 'User', amount: 200, desc: '+cmd|=SUM(A1)' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).not.toContain('"+cmd|=SUM(A1)"');
      expect(csv).toContain('\t+cmd|=SUM(A1)');
    });

    it('should neutralize - prefix (command injection)', () => {
      const data = [{ name: 'User', amount: 200, desc: '-3+3+cmd|=SUM(A1)' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).not.toContain('"-3+3+cmd');
      expect(csv).toContain('\t-3+3+cmd');
    });

    it('should neutralize @ prefix (DDE injection)', () => {
      const data = [{ name: 'User', amount: 200, desc: '@SUM(1+9)*cmd' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).not.toContain('"@SUM(1+9)');
      expect(csv).toContain('\t@SUM(1+9)');
    });

    it('should neutralize HYPERLINK formula in account name', () => {
      const data = [{ name: '=HYPERLINK("http://evil.com","Click")', amount: 100, desc: 'Normal' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).not.toContain('"=HYPERLINK');
      expect(csv).toContain('\t=HYPERLINK');
    });

    it('should neutralize DDE formula injection attempt', () => {
      const data = [{ name: '=cmd|" /C calc"!A0', amount: 0, desc: 'DDE attack' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).not.toContain('"=cmd|');
      expect(csv).toContain('\t=cmd|');
    });
  });

  describe('Safe Values Pass-Through', () => {
    it('should correctly export normal rupee amounts', () => {
      const data = [{ name: 'SBI Savings', amount: 125000, desc: 'Monthly salary credit' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).toContain('"SBI Savings"');
      expect(csv).toContain('"125000"');
      expect(csv).toContain('"Monthly salary credit"');
    });

    it('should handle Indian rupee symbol ₹ in descriptions', () => {
      const data = [{ name: 'Transfer', amount: 50000, desc: 'Paid ₹50,000 to vendor' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).toContain('Paid ₹50,000 to vendor');
    });

    it('should handle Hindi/Devanagari characters in names', () => {
      const data = [{ name: 'रोहन शर्मा', amount: 10000, desc: 'वेतन' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).toContain('रोहन शर्मा');
      expect(csv).toContain('वेतन');
    });

    it('should escape internal double quotes correctly', () => {
      const data = [{ name: 'Company "ABC" Ltd', amount: 5000, desc: 'Test' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).toContain('"Company ""ABC"" Ltd"');
    });

    it('should handle commas within values', () => {
      const data = [{ name: 'Food, Groceries', amount: 3500, desc: 'Weekly shopping' }];
      const csv = captureLastCsvExport('test', headers, data);
      expect(csv).toContain('"Food, Groceries"'); // comma inside quotes — safe
    });

    it('should handle null and undefined values as empty strings', () => {
      const data = [{ name: null, amount: undefined, desc: '' }];
      const csv = captureLastCsvExport('test', headers, data as unknown as Record<string, unknown>[]);
      expect(csv).toContain('""'); // null/undefined should be empty quoted string
    });
  });

  describe('Error Handling', () => {
    it('should throw CsvExportError when data is empty', () => {
      expect(() => exportToCSV('test', headers as { label: string; key: keyof Record<string, unknown> }[], [])).toThrowError(CsvExportError);
      expect(() => exportToCSV('test', headers as { label: string; key: keyof Record<string, unknown> }[], [])).toThrowError('No data available to export.');
    });

    it('should throw CsvExportError when data is null-like', () => {
      expect(() => exportToCSV('test', headers as { label: string; key: keyof Record<string, unknown> }[], null as unknown as [])).toThrowError(CsvExportError);
    });
  });
});
