import { NextResponse } from 'next/server'
import { holidayDB } from '@/lib/db'

export async function GET() {
  try {
    const holidays = await holidayDB.getAll()
    return NextResponse.json({ success: true, data: holidays })
  } catch (error) {
    console.error('GET /api/holidays error:', error)
    return NextResponse.json({ error: 'Failed to load holidays' }, { status: 500 })
  }
}
