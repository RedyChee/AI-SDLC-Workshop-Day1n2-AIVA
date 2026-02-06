import { NextRequest, NextResponse } from 'next/server';
import { userDB, authenticatorDB } from '@/lib/db';

/**
 * POST /api/auth/authenticators
 * Get list of authenticators for a username (public endpoint for login page)
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json(
        { authenticators: [] }
      );
    }

    // Get user's authenticators
    const authenticators = authenticatorDB.getByUserId(user.id);

    // Return sanitized authenticator info (no sensitive data)
    const sanitized = authenticators.map(auth => ({
      id: auth.id,
      createdAt: auth.created_at,
      // Don't expose credential_id, public_key, or counter
    }));

    return NextResponse.json({
      authenticators: sanitized,
      count: sanitized.length,
    });
  } catch (error) {
    console.error('Get authenticators error:', error);
    return NextResponse.json(
      { error: 'Failed to get authenticators' },
      { status: 500 }
    );
  }
}
