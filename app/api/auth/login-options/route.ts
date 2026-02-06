import { NextRequest, NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
} from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const RP_ID = process.env.RP_ID || 'localhost';

/**
 * POST /api/auth/login-options
 * Generate WebAuthn authentication options for existing user
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user exists
    const user = userDB.getByUsername(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's authenticators
    const authenticators = authenticatorDB.getByUserId(user.id);

    if (authenticators.length === 0) {
      return NextResponse.json({ error: 'No authenticators found for user' }, { status: 400 });
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      allowCredentials: authenticators.map((auth) => ({
        id: auth.credential_id,
        transports: ['internal', 'hybrid'],
      })) as any,
      userVerification: 'preferred',
    };

    const options = await generateAuthenticationOptions(opts);

    return NextResponse.json({ options, username: user.username });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 });
  }
}
