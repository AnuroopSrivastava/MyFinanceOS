import { describe, it, expect } from 'vitest';
import { GET as getRoot } from '../../app/api/route.js';
import { GET as getStatus, POST as postStatus } from '../../app/api/status/route.js';

describe('Next.js API Status & Root Endpoints', () => {
  it('GET /api returns Hello World message', async () => {
    const response = await getRoot();
    const data = await response.json();
    expect(data).toEqual({ message: 'Hello World' });
  });

  it('POST /api/status creates a status check record', async () => {
    const req = new Request('http://localhost:3000/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'test-client' }),
    });

    const response = await postStatus(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.client_name).toBe('test-client');
    expect(data.id).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('GET /api/status returns list of status checks', async () => {
    const response = await getStatus();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});
