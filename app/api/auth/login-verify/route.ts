import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';

const RP_ID = process.env.RP_ID || 'localhost';

/**
 * POST /api/auth/login-verify
 * Verify WebAuthn authentication response and create session
 */
export async function POST(request: NextRequest) {
  try {
    const { username, challenge, credential } = await request.json();

    if (!username || !challenge || !credential) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user
    const user = userDB.getByUsername(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get authenticator by credential ID
    const credentialId = isoBase64URL.fromBuffer(credential.id);
    const authenticator = authenticatorDB.getByCredentialId(credentialId);

    if (!authenticator || authenticator.user_id !== user.id) {
      return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
    }

    // Get origin from request to support dynamic ports
    const origin = request.headers.get('origin') || process.env.ORIGIN || 'http://localhost:3000';

    // Verify the credential
    const opts: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: RP_ID,
      credential: {
        id: authenticator.credential_id,
        publicKey: isoBase64URL.toBuffer(authenticator.public_key),
        counter: authenticator.counter ?? 0,
      } as any,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (!verification.verified) {
      return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
    }

    // Update counter
    authenticatorDB.updateCounter(authenticator.id, verification.authenticationInfo.newCounter ?? 0);

    // Create session
    const token = await createSession(user.id, user.username);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json({ error: 'Authentication verification failed' }, { status: 500 });
  }
}
