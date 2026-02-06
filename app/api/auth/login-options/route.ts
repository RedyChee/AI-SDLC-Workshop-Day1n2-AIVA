import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

/**
 * POST /api/auth/login-options
 * Generate WebAuthn authentication options (challenge)
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's authenticators
    const authenticators = authenticatorDB.getByUserId(user.id);
    if (authenticators.length === 0) {
      return NextResponse.json(
        { error: 'No authenticators registered for this user' },
        { status: 400 }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60000,
      allowCredentials: authenticators.map(auth => ({
        id: auth.credential_id, // Keep as base64url string (SimpleWebAuthn v10+)
        type: 'public-key' as const,
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      })),
      userVerification: 'preferred',
    });

    return NextResponse.json({
      options,
      userId: user.id,
    });
  } catch (error) {
    console.error('Login options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
