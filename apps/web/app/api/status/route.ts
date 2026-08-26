import { NextResponse } from 'next/server';

interface StatusCheck {
  id: string;
  client_name: string;
  timestamp: string;
}

const inMemoryStatusChecks: StatusCheck[] = [];

export async function GET() {
  return NextResponse.json(inMemoryStatusChecks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newStatus: StatusCheck = {
      id: crypto.randomUUID(),
      client_name: body.client_name || 'anonymous',
      timestamp: new Date().toISOString(),
    };
    inMemoryStatusChecks.push(newStatus);
    return NextResponse.json(newStatus, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}
