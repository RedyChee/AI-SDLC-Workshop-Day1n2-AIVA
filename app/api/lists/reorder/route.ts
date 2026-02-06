import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { listIds } = body;

  if (!Array.isArray(listIds)) {
    return NextResponse.json({ error: 'listIds must be an array' }, { status: 400 });
  }

  listDB.reorder(session.userId, listIds);

  return NextResponse.json({ success: true });
}
