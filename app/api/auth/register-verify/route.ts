import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

/**
 * POST /api/auth/register-verify
 * Verify WebAuthn registration response and create user account
 */
export async function POST(request: NextRequest) {
  try {
    const { username, credential, challenge } = await request.json();

    // Validate inputs
    if (!username || !credential || !challenge) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Double-check user doesn't exist (race condition protection)
    const existingUser = userDB.getByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 400 }
      );
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    // Create user
    const user = userDB.create(username);

    // Store authenticator - CRITICAL: use ?? 0 for counter to handle undefined
    // credentialID and credentialPublicKey might be Uint8Array or string depending on version
    // Use type assertion to handle inconsistent type definitions
    authenticatorDB.create({
      user_id: user.id,
      credential_id: (typeof credentialID === 'string' ? credentialID : isoBase64URL.fromBuffer(credentialID)) as string,
      public_key: (typeof credentialPublicKey === 'string' ? credentialPublicKey : isoBase64URL.fromBuffer(credentialPublicKey)) as string,
      counter: counter ?? 0,
    });

    // Create session token
    const token = await createSession(user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Registration verify error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
