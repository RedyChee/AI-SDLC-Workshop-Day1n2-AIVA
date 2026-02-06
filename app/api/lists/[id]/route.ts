import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const list = listDB.getById(parseInt(id), session.userId);

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  return NextResponse.json(list);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, icon, color, position } = body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;
  if (position !== undefined) updates.position = position;

  const list = listDB.update(parseInt(id), session.userId, updates);

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  return NextResponse.json(list);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  listDB.delete(parseInt(id), session.userId);

  return NextResponse.json({ success: true });
}
