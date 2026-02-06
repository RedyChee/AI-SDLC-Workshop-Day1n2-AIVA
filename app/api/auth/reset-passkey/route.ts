import { NextRequest, NextResponse } from 'next/server';
import { userDB, authenticatorDB } from '@/lib/db';

/**
 * POST /api/auth/reset-passkey
 * Delete all authenticators for a user (allows re-registration)
 * Public endpoint - requires username confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const { username, confirmUsername } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      );
    }

    // Require confirmation to prevent accidental deletion
    if (username !== confirmUsername) {
      return NextResponse.json(
        { error: 'Username confirmation does not match' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all authenticators for this user
    const authenticators = authenticatorDB.getByUserId(user.id);
    for (const auth of authenticators) {
      authenticatorDB.delete(auth.id);
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${authenticators.length} passkey(s) for user ${username}. You can now register again.`,
      deletedCount: authenticators.length,
    });
  } catch (error) {
    console.error('Reset passkey error:', error);
    return NextResponse.json(
      { error: 'Failed to reset passkey' },
      { status: 500 }
    );
  }
}
