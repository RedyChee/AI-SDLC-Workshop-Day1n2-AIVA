import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const lists = listDB.getAll(session.userId);
  return NextResponse.json(lists);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { name, icon, color } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Get max position for new list
  const existingLists = listDB.getAll(session.userId);
  const maxPosition = existingLists.reduce((max, list) => Math.max(max, list.position), -1);

  const list = listDB.create({
    user_id: session.userId,
    name,
    icon: icon || '📋',
    color: color || '#3B82F6',
    position: maxPosition + 1,
  });

  return NextResponse.json(list, { status: 201 });
}
