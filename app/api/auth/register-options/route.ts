import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/db';

const RP_NAME = 'Todo App';
const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

/**
 * POST /api/auth/register-options
 * Generate WebAuthn registration options (challenge)
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be alphanumeric (letters, numbers, underscores only)' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = userDB.getByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Generate registration options
    // Convert username to Uint8Array (required by SimpleWebAuthn v10+)
    const userIDBuffer = new TextEncoder().encode(username);
    
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userIDBuffer, // Must be Uint8Array, not string
      userName: username,
      timeout: 60000, // 60 seconds
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    // Return options and username
    // Challenge is stored client-side for verification
    return NextResponse.json({
      options,
      username,
    });
  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
