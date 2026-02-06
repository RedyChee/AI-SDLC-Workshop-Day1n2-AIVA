import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { userDB } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRY_DAYS = 7;

export interface SessionData {
  userId: number;
  username: string;
}

/**
 * Create a session token for a user
 * Uses jose library for Edge Runtime compatibility
 */
export async function createSession(userId: number, username: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a session token
 * Uses jose library for Edge Runtime compatibility
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current session from cookies
 * Also validates that the user still exists in the database
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  const session = await verifySession(sessionCookie.value);
  if (!session) {
    return null;
  }

  // Verify user still exists in database
  const user = userDB.getById(session.userId);
  if (!user) {
    return null;
  }

  return session;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  return session;
}
