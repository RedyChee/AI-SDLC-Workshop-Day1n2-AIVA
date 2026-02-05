import { NextResponse } from 'next/server'
import { resetMockDB } from '@/lib/db'

export async function POST() {
  resetMockDB()
  return NextResponse.json({ success: true })
}
