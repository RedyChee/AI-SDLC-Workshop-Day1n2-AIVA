import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to protect routes requiring authentication
 * Checks session cookie and redirects to /auth if not authenticated
 * 
 * Note: Uses 'jose' library instead of 'jsonwebtoken' because middleware
 * runs in Edge Runtime which doesn't support Node.js crypto module
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session cookie
  const sessionCookie = request.cookies.get('session');

  // If no session cookie, redirect to auth
  if (!sessionCookie) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(authUrl);
  }

  try {
    // Verify JWT token using jose (Edge Runtime compatible)
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(sessionCookie.value, secret);

    // Session valid - allow request to proceed
    return NextResponse.next();
  } catch (error) {
    // Invalid or expired token - redirect to auth
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(authUrl);
  }
}

/**
 * Configure which routes should be protected by this middleware
 */
export const config = {
  matcher: [
    '/',
    '/calendar',
    // Add more protected routes here
    // Exclude API routes, static files, and auth page
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
