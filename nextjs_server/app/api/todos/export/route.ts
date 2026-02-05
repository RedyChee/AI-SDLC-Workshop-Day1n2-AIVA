import { NextResponse } from 'next/server'
import { exportDB } from '@/lib/db'

export async function GET() {
  try {
    const payload = await exportDB.exportAll()
    return NextResponse.json({ version: 1, ...payload })
  } catch (error) {
    console.error('GET /api/todos/export error:', error)
    return NextResponse.json({ error: 'Failed to export todos' }, { status: 500 })
  }
}
