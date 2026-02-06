import { NextRequest, NextResponse } from 'next/server';
import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
} from '@simplewebauthn/server';
import { userDB } from '@/lib/db';

const RP_NAME = 'Todo App';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

/**
 * POST /api/auth/register-options
 * Generate WebAuthn registration options for a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = userDB.getByUsername(username.trim());
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: username.trim(),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    };

    const options = await generateRegistrationOptions(opts);

    // Store challenge in response (client will send it back)
    return NextResponse.json({ options, username: username.trim() });
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
  }
}
