import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';

/**
 * POST /api/auth/dev-login
 * Development-only login endpoint for testing
 * Creates a test user and session
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Development login not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const username = body.username || 'testuser';

    // Get or create test user
    let user = userDB.getByUsername(username);
    
    if (!user) {
      user = userDB.create(username);
    }

    // Create session
    const token = await createSession(user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
