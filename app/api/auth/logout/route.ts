import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Clear session cookie and log out user
 */
export async function POST(request: NextRequest) {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
