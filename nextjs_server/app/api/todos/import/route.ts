import { NextRequest, NextResponse } from 'next/server'
import { exportDB } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as any
    if (!payload || !Array.isArray(payload.todos) || !Array.isArray(payload.tags) || !Array.isArray(payload.templates)) {
      return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 })
    }

    const result = await exportDB.importAll(payload)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('POST /api/todos/import error:', error)
    return NextResponse.json({ error: 'Failed to import todos' }, { status: 400 })
  }
}
