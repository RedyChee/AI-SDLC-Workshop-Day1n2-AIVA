import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { authenticatorDB, userDB } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

/**
 * POST /api/auth/login-verify
 * Verify WebAuthn authentication response and create session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, credential, challenge } = await request.json();

    if (!userId || !credential || !challenge) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticator by credential ID
    const credentialId = credential.id;
    const authenticator = authenticatorDB.getByCredentialId(credentialId);
    
    if (!authenticator || authenticator.user_id !== userId) {
      return NextResponse.json(
        { error: 'Authenticator not found' },
        { status: 404 }
      );
    }

    // Get user info
    const user = userDB.getById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify authentication - CRITICAL: use ?? 0 for counter to handle undefined
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(authenticator.credential_id),
        credentialPublicKey: isoBase64URL.toBuffer(authenticator.public_key),
        counter: authenticator.counter ?? 0,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 401 }
      );
    }

    // Update counter (anti-replay protection) - CRITICAL: use ?? 0 for newCounter
    if (verification.authenticationInfo) {
      authenticatorDB.updateCounter(
        authenticator.id,
        verification.authenticationInfo.newCounter ?? 0
      );
    }

    // Create session
    const token = await createSession(user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login verify error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
