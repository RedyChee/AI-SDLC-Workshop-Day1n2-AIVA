# PRP-11: WebAuthn/Passkeys Authentication

## Feature Overview

The WebAuthn/Passkeys Authentication system provides secure, passwordless access to the todo application using modern biometric authentication. Users register with a username and authenticate using device biometrics (fingerprint, Face ID), platform authenticators (Windows Hello, Touch ID), or hardware security keys (YubiKey). The system eliminates password management entirely while providing stronger security through public-key cryptography and device-bound credentials.

### Core Functionality
- **Passwordless Registration**: Create accounts using username + biometric/security key
- **Passwordless Login**: Authenticate using passkeys (no password entry)
- **Session Management**: JWT-based sessions with HTTP-only cookies (7-day expiry)
- **Route Protection**: Middleware guards protected routes (`/`, `/calendar`)
- **Multi-Device Support**: Passkeys sync across devices via platform providers (iCloud, Google)
- **Security Key Support**: Hardware authenticators (YubiKey, Titan Key)
- **Logout Functionality**: Clear sessions and redirect to auth page

### User Value
- **No passwords to remember** - eliminates password fatigue and reset flows
- **Stronger security** - phishing-resistant, no credential reuse attacks
- **Faster authentication** - one-touch biometric vs typing passwords
- **Cross-platform** - passkeys sync via iCloud Keychain, Google Password Manager
- **Privacy-preserving** - credentials never leave device, no central password database
- **Developer-friendly** - simpler auth flows, no password validation/hashing

---

## User Stories

### Story 1: Register New Account with Passkey
**As a** new user  
**I want to** create an account using my device's biometric authentication  
**So that** I can access the app without creating a password

**Acceptance Criteria:**
- Auth page displays registration form with username input
- Username must be unique (3-30 characters)
- "Register" button triggers WebAuthn registration ceremony
- Browser prompts for biometric (fingerprint, Face ID) or security key
- System creates user account and authenticator record on success
- User immediately logged in with JWT session cookie
- Redirected to main todo page (`/`)

### Story 2: Login with Existing Passkey
**As a** returning user  
**I want to** login using my saved passkey  
**So that** I can quickly access my todos

**Acceptance Criteria:**
- Auth page displays login form with username input
- Username field suggests saved usernames (browser autocomplete)
- "Login" button triggers WebAuthn authentication ceremony
- Browser prompts for biometric or security key
- System verifies credential and creates session on success
- User redirected to main todo page (`/`)
- Invalid credentials show error message

### Story 3: Session Persistence
**As a** user who stays logged in  
**I want to** remain authenticated across browser sessions  
**So that** I don't have to login repeatedly

**Acceptance Criteria:**
- JWT session stored in HTTP-only cookie
- Cookie expires after 7 days of inactivity
- Cookie sent automatically with API requests
- Closing browser doesn't invalidate session (within 7 days)
- Session validates user exists and authenticator is active

### Story 4: Access Protected Routes
**As a** logged-in user  
**I want to** automatically access protected pages  
**So that** I can use the app seamlessly

**Acceptance Criteria:**
- Middleware checks session before rendering `/` and `/calendar`
- Valid session allows page access
- Invalid/missing session redirects to `/auth`
- API routes return 401 for unauthenticated requests
- Redirect preserves original URL (optional return-to)

### Story 5: Logout from Application
**As a** logged-in user  
**I want to** logout to end my session  
**So that** I can secure my account on shared devices

**Acceptance Criteria:**
- "Logout" button visible in top-right navigation
- Clicking logout clears session cookie
- User redirected to `/auth` page
- Subsequent requests to protected routes require re-authentication
- Session invalidated server-side

### Story 6: Register with Security Key (Hardware)
**As a** security-conscious user  
**I want to** use a hardware security key (YubiKey)  
**So that** I have stronger phishing protection

**Acceptance Criteria:**
- Registration supports hardware authenticators
- Browser prompts to insert and tap security key
- Credential created and stored on hardware device
- User can authenticate with same key later
- Supports USB, NFC, and Bluetooth security keys

### Story 7: Multi-Authenticator Support
**As a** user with multiple devices  
**I want to** register multiple passkeys  
**So that** I can login from different devices

**Acceptance Criteria:**
- User can register additional authenticators
- Each authenticator stored separately in database
- Login works with any registered authenticator
- Authenticator counter prevents cloning/replay attacks
- User can manage (view/delete) authenticators (future enhancement)

### Story 8: Handle Authentication Errors
**As a** user encountering auth issues  
**I want to** see clear error messages  
**So that** I understand what went wrong

**Acceptance Criteria:**
- "User already exists" error during registration
- "User not found" error during login
- "Verification failed" for invalid credentials
- "WebAuthn not supported" for incompatible browsers
- "Operation canceled" when user dismisses prompt
- Errors displayed in red below form

### Story 9: Browser Compatibility
**As a** user on modern browsers  
**I want to** use WebAuthn authentication  
**So that** I can login securely

**Acceptance Criteria:**
- Works in Chrome 67+ (desktop and mobile)
- Works in Firefox 60+ (desktop and mobile)
- Works in Safari 13+ (macOS and iOS)
- Works in Edge 18+ (Windows)
- Graceful degradation message for unsupported browsers

### Story 10: Secure Session Storage
**As a** user concerned about security  
**I want to** my session to be secure  
**So that** attackers cannot steal my credentials

**Acceptance Criteria:**
- Session token stored in HTTP-only cookie (no JavaScript access)
- Cookie has Secure flag (HTTPS only in production)
- Cookie has SameSite=Lax (CSRF protection)
- JWT signed with HS256 and secret key
- Token includes user ID and expiration timestamp

---

## User Flow

### Flow 1: First-Time Registration
1. User visits app URL (e.g., `https://todoapp.example.com`)
2. No session exists → middleware redirects to `/auth`
3. Auth page loads showing:
   - App title/logo
   - Username input field
   - "Register" button
   - "Login" button
   - Minimal, clean design
4. User enters username: "alice"
5. User clicks **"Register"** button
6. Frontend calls `/api/auth/register-options` with username
7. Backend:
   - Checks if "alice" already exists
   - If exists: Returns 409 error
   - If available: Generates WebAuthn challenge
   - Returns PublicKeyCredentialCreationOptions
8. Frontend receives options
9. Frontend calls `navigator.credentials.create()` with options
10. Browser displays platform-specific prompt:
    - **iPhone/iPad**: "Sign in with Face ID" or "Sign in with Touch ID"
    - **Android**: "Use fingerprint to continue"
    - **macOS**: "Touch ID to create passkey"
    - **Windows**: "Windows Hello" fingerprint/face/PIN
    - **Security Key**: "Insert and tap your security key"
11. User performs biometric authentication (e.g., places finger on sensor)
12. Browser generates public/private key pair
13. Private key stored securely on device (never leaves)
14. Public key credential returned to frontend
15. Frontend posts credential to `/api/auth/register-verify`
16. Backend:
    - Verifies credential using `@simplewebauthn/server`
    - Creates user record in database
    - Creates authenticator record (credential ID, public key, counter)
    - Generates JWT session token
    - Sets HTTP-only cookie with token
17. Backend returns success response
18. Frontend redirects to `/` (main todo page)
19. User now authenticated, sees empty todo list
20. "Logout" button visible in top-right

**Time estimate**: 10-15 seconds

### Flow 2: Returning User Login
1. User visits app URL
2. Middleware checks session cookie
3. No valid session → redirect to `/auth`
4. Auth page loads
5. User enters username: "alice"
6. Browser autocomplete may suggest "alice" (saved from registration)
7. User clicks **"Login"** button
8. Frontend calls `/api/auth/login-options` with username
9. Backend:
   - Checks if user "alice" exists
   - If not found: Returns 404 error
   - Fetches all authenticators for "alice"
   - Generates WebAuthn challenge
   - Returns PublicKeyCredentialRequestOptions with allowed credentials
10. Frontend receives options
11. Frontend calls `navigator.credentials.get()` with options
12. Browser displays authentication prompt:
    - Shows saved passkey options
    - May auto-select if only one passkey
    - User confirms with biometric
13. User performs biometric verification
14. Browser signs challenge with private key
15. Credential response returned to frontend
16. Frontend posts response to `/api/auth/login-verify`
17. Backend:
    - Verifies signature using stored public key
    - Validates challenge matches
    - Checks authenticator counter (anti-replay)
    - Updates counter in database
    - Generates JWT session token
    - Sets HTTP-only cookie
18. Backend returns success
19. Frontend redirects to `/`
20. User sees their todo list

**Time estimate**: 3-5 seconds

### Flow 3: Session Validation on Protected Route
1. User clicks "Calendar" button
2. Browser navigates to `/calendar`
3. Middleware intercepts request
4. Middleware checks for session cookie
5. Cookie present → extract JWT token
6. Middleware verifies JWT:
   - Signature valid?
   - Not expired?
   - User ID present?
7. If valid:
   - Query database for user
   - User exists?
   - Attach user info to request context
   - Allow request to proceed
8. Calendar page renders
9. User sees calendar view

**Alternative (invalid session)**:
6. JWT invalid/expired/missing
7. Middleware redirects to `/auth?returnTo=/calendar`
8. User must authenticate
9. After auth, redirected back to `/calendar`

### Flow 4: Logout Process
1. User clicks **"Logout"** button (top-right corner)
2. Frontend calls `/api/auth/logout` (POST)
3. Backend:
   - Clears session cookie (set expiry to past date)
   - Returns success response
4. Frontend receives response
5. Frontend redirects to `/auth`
6. User sees login/register page
7. Clicking browser back won't access protected routes (session cleared)

### Flow 5: API Request with Session
1. User on main page (`/`)
2. User creates new todo
3. Frontend sends POST to `/api/todos`
4. Browser automatically includes session cookie (HttpOnly, SameSite)
5. API route handler calls `getSession()`
6. Session extracted from cookie
7. JWT verified and decoded
8. User ID retrieved from token payload
9. Database operation uses `session.userId`
10. Todo created for correct user
11. Response returned

### Flow 6: Expired Session Handling
1. User logged in 8 days ago (session expired)
2. User visits app
3. Middleware checks session
4. JWT expiration check fails (> 7 days old)
5. Middleware redirects to `/auth`
6. User must re-authenticate
7. New session created (fresh 7-day expiry)

### Flow 7: Registration with Hardware Security Key
1. User on `/auth` page
2. User enters username: "bob"
3. User clicks **"Register"**
4. Frontend calls `/api/auth/register-options`
5. Backend returns challenge (with `authenticatorSelection.authenticatorAttachment = "cross-platform"` supported)
6. Frontend calls `navigator.credentials.create()`
7. Browser detects no platform authenticator available (or user selects security key option)
8. Browser prompt: "Insert your security key"
9. User inserts YubiKey into USB port
10. Browser prompt: "Touch your security key"
11. User touches YubiKey button
12. YubiKey generates credential and signs challenge
13. Credential returned to frontend
14. Frontend verifies and creates account
15. User logged in with hardware key

### Flow 8: Login from Multiple Devices
**Scenario**: User registered on iPhone, now using MacBook

1. User on MacBook visits app
2. Redirected to `/auth`
3. User enters username: "alice"
4. User clicks **"Login"**
5. Frontend calls `/api/auth/login-options`
6. Backend returns allowed credentials (includes iPhone passkey)
7. Browser shows: "Sign in with passkey from iPhone" (if nearby via BLE)
   - OR "Touch ID" (if user also registered on MacBook)
8. **Option A**: User selects "iPhone passkey"
   - iPhone displays "Sign in to todoapp.example.com?"
   - User confirms with Face ID on iPhone
   - Credential sent from iPhone to MacBook via Bluetooth
   - MacBook completes login
9. **Option B**: User selects "Touch ID"
   - User touches MacBook Touch ID sensor
   - MacBook uses locally registered passkey
   - Login completes

### Flow 9: Error Handling - User Already Exists
1. User on `/auth` page
2. User enters username: "alice" (already registered)
3. User clicks **"Register"**
4. Frontend calls `/api/auth/register-options`
5. Backend checks database
6. "alice" already exists
7. Backend returns 409 Conflict error:
   ```json
   { "error": "User already exists" }
   ```
8. Frontend displays error message in red below form:
   "⚠️ User already exists. Please choose a different username or login."
9. User can:
   - Change username and retry
   - Click "Login" instead

### Flow 10: Concurrent Session Management
1. User "alice" logged in on Device A (laptop)
2. User "alice" logs in on Device B (phone)
3. Both devices have separate JWT tokens
4. Both sessions valid simultaneously
5. User logs out on Device A
6. Only Device A session cleared
7. Device B remains logged in
8. **Note**: Single session per device, multiple devices supported

---

## Technical Requirements

### Database Schema

#### Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

**Fields:**
- `id`: Unique user identifier (auto-increment)
- `username`: Unique username (3-30 characters, alphanumeric + underscore)
- `created_at`: Account creation timestamp (ISO8601, UTC)

#### Authenticators Table

```sql
CREATE TABLE IF NOT EXISTS authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_authenticators_credential_id ON authenticators(credential_id);
```

**Fields:**
- `id`: Authenticator record ID (auto-increment)
- `user_id`: Foreign key to users table
- `credential_id`: Base64URL-encoded credential identifier (unique)
- `public_key`: Base64URL-encoded public key for verification
- `counter`: Signature counter for anti-replay protection
- `transports`: JSON array of transport types (`["usb", "nfc", "ble", "internal"]`)
- `created_at`: Registration timestamp

**Notes:**
- CASCADE delete: Deleting user removes all authenticators
- Multiple authenticators per user supported
- `credential_id` must be unique globally (prevents credential reuse across users)

### API Routes

#### POST /api/auth/register-options

Generate WebAuthn registration options (challenge).

```typescript
// app/api/auth/register-options/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/db';

const RP_NAME = 'Todo App';
const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

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
        { error: 'Username must be alphanumeric' },
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
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: username, // Use username as user ID for registration
      userName: username,
      timeout: 60000, // 60 seconds
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    // Store challenge in session or database (temporary)
    // For simplicity, we'll include it in the response
    // Production: store in Redis/memory with expiry

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
```

**Request:**
```json
{
  "username": "alice"
}
```

**Response (200):**
```json
{
  "options": {
    "challenge": "8j7Y...",
    "rp": { "name": "Todo App", "id": "localhost" },
    "user": { "id": "alice", "name": "alice", "displayName": "alice" },
    "pubKeyCredParams": [...],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {...}
  },
  "username": "alice"
}
```

#### POST /api/auth/register-verify

Verify WebAuthn registration response and create user.

```typescript
// app/api/auth/register-verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

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
    const user = userDB.create({ username });

    // Store authenticator
    authenticatorDB.create({
      userId: user.id,
      credentialId: isoBase64URL.fromBuffer(credentialID),
      publicKey: isoBase64URL.fromBuffer(credentialPublicKey),
      counter: counter ?? 0,
      transports: credential.response.transports || [],
    });

    // Create session
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
    });

    await createSession(response, user.id);

    return response;
  } catch (error) {
    console.error('Registration verify error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

**Request:**
```json
{
  "username": "alice",
  "challenge": "8j7Y...",
  "credential": {
    "id": "AY3k...",
    "rawId": "AY3k...",
    "response": {
      "attestationObject": "o2Nm...",
      "clientDataJSON": "eyJ0..."
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful"
}
```

**Sets cookie:**
```
Set-Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

#### POST /api/auth/login-options

Generate WebAuthn authentication options (challenge).

```typescript
// app/api/auth/login-options/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { userDB, authenticatorDB } from '@/lib/db';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
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
        { error: 'No authenticators registered' },
        { status: 400 }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60000,
      allowCredentials: authenticators.map(auth => ({
        id: isoBase64URL.toBuffer(auth.credential_id),
        type: 'public-key',
        transports: auth.transports ? JSON.parse(auth.transports) : undefined,
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
```

**Response:**
```json
{
  "options": {
    "challenge": "9k8Z...",
    "timeout": 60000,
    "rpId": "localhost",
    "allowCredentials": [
      {
        "id": "AY3k...",
        "type": "public-key",
        "transports": ["internal"]
      }
    ],
    "userVerification": "preferred"
  },
  "userId": 1
}
```

#### POST /api/auth/login-verify

Verify WebAuthn authentication response and create session.

```typescript
// app/api/auth/login-verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

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
    const credentialId = isoBase64URL.fromBuffer(
      isoBase64URL.toBuffer(credential.id)
    );
    
    const authenticator = authenticatorDB.getByCredentialId(credentialId);
    
    if (!authenticator || authenticator.user_id !== userId) {
      return NextResponse.json(
        { error: 'Authenticator not found' },
        { status: 404 }
      );
    }

    // Verify authentication
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

    // Update counter (anti-replay)
    if (verification.authenticationInfo) {
      authenticatorDB.updateCounter(
        authenticator.id,
        verification.authenticationInfo.newCounter ?? 0
      );
    }

    // Create session
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    await createSession(response, userId);

    return response;
  } catch (error) {
    console.error('Login verify error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
```

#### POST /api/auth/logout

Clear session and logout user.

```typescript
// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  clearSession(response);

  return response;
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Sets cookie:**
```
Set-Cookie: session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/
```

### Authentication Library

```typescript
// lib/auth.ts

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { userDB } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
  userId: number;
  username: string;
}

/**
 * Create JWT session and set HTTP-only cookie
 */
export async function createSession(
  response: NextResponse,
  userId: number
): Promise<void> {
  // Get user to include username in token
  const user = userDB.getById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Create JWT
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  // Set cookie
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Clear session cookie (logout)
 */
export function clearSession(response: NextResponse): void {
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Get current session from cookie
 * Used in API routes
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validate user exists
    const user = userDB.getById(payload.userId as number);
    if (!user) {
      return null;
    }

    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Get session from request (for middleware)
 */
export async function getSessionFromRequest(
  request: Request
): Promise<SessionData | null> {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    // Parse session cookie
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return null;
    }

    const token = sessionCookie.split('=')[1];

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch (error) {
    return null;
  }
}
```

### Middleware

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ['/auth', '/api/auth/register-options', '/api/auth/register-verify', '/api/auth/login-options', '/api/auth/login-verify'];
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check session
  const session = await getSessionFromRequest(request);

  // No session → redirect to auth
  if (!session) {
    const url = new URL('/auth', request.url);
    // Optional: preserve return URL
    // url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  // Session valid → allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/calendar',
    '/api/todos/:path*',
    '/api/tags/:path*',
    '/api/templates/:path*',
    '/api/calendar/:path*',
    '/api/notifications/:path*',
    '/api/auth/logout',
  ],
};
```

### Database Helpers

```typescript
// lib/db.ts - Add authentication interfaces and methods

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  created_at: string;
}

export const userDB = {
  create(data: { username: string }): User {
    const stmt = db.prepare(`
      INSERT INTO users (username)
      VALUES (?)
    `);
    
    const result = stmt.run(data.username);
    
    return {
      id: result.lastInsertRowid as number,
      username: data.username,
      created_at: new Date().toISOString(),
    };
  },

  getById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

  getByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },
};

export const authenticatorDB = {
  create(data: {
    userId: number;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
  }): Authenticator {
    const stmt = db.prepare(`
      INSERT INTO authenticators (user_id, credential_id, public_key, counter, transports)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.userId,
      data.credentialId,
      data.publicKey,
      data.counter,
      JSON.stringify(data.transports)
    );
    
    return {
      id: result.lastInsertRowid as number,
      user_id: data.userId,
      credential_id: data.credentialId,
      public_key: data.publicKey,
      counter: data.counter,
      transports: JSON.stringify(data.transports),
      created_at: new Date().toISOString(),
    };
  },

  getByUserId(userId: number): Authenticator[] {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE user_id = ?');
    return stmt.all(userId) as Authenticator[];
  },

  getByCredentialId(credentialId: string): Authenticator | null {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE credential_id = ?');
    return stmt.get(credentialId) as Authenticator | null;
  },

  updateCounter(id: number, counter: number): void {
    const stmt = db.prepare('UPDATE authenticators SET counter = ? WHERE id = ?');
    stmt.run(counter, id);
  },
};
```

### Frontend Authentication Page

```typescript
// app/auth/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export default function AuthPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || 'Failed to get registration options');
      }

      const { options } = await optionsRes.json();

      // Start WebAuthn registration
      const credential = await startRegistration(options);

      // Verify registration
      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to main page
      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Get authentication options
      const optionsRes = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || 'Failed to get login options');
      }

      const { options, userId } = await optionsRes.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication
      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to main page
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 
      dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📝 Todo App
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Passwordless authentication with WebAuthn
          </p>
        </div>

        {/* Username Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
              rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
            dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            disabled={!username || loading}
            className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>

          <button
            onClick={handleLogin}
            disabled={!username || loading}
            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>First time?</strong> Click Register and use your device's 
            biometric authentication (fingerprint, Face ID) or security key.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Logout Button Component

```typescript
// components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 
        text-white rounded-lg transition-colors"
    >
      Logout
    </button>
  );
}
```

---

## Edge Cases

### 1. User Cancels WebAuthn Prompt
**Scenario:** User clicks "Cancel" on biometric prompt

**Handling:**
- Browser throws `NotAllowedError` exception
- Frontend catches error
- Display message: "Authentication canceled. Please try again."
- User can retry registration/login
- No database changes made

### 2. WebAuthn Not Supported
**Scenario:** User on old browser without WebAuthn support

**Handling:**
- Check `navigator.credentials` availability
- Display error message: "WebAuthn not supported. Please use a modern browser (Chrome 67+, Firefox 60+, Safari 13+)."
- Provide browser upgrade links
- Graceful degradation (no fallback to passwords)

### 3. Network Timeout During Registration
**Scenario:** API call fails mid-registration

**Handling:**
- Frontend times out after 60 seconds
- Display error: "Network error. Please try again."
- User can retry registration
- Partial database writes rolled back (transaction)
- Challenge expires after 60 seconds

### 4. Duplicate Credential ID
**Scenario:** Same credential used for multiple users (unlikely but possible)

**Handling:**
- Database UNIQUE constraint on `credential_id` prevents duplicates
- Registration fails with 500 error
- User must register with different authenticator
- Error message: "Credential already in use"

### 5. Counter Mismatch (Cloned Authenticator)
**Scenario:** Attacker clones authenticator

**Handling:**
- WebAuthn counter validation detects replay
- `verifyAuthenticationResponse` fails
- Login rejected with 401 error
- User notified: "Authentication failed. Security issue detected."
- User should re-register with new authenticator

### 6. Session Expired Mid-Request
**Scenario:** JWT expires while user is active

**Handling:**
- API route calls `getSession()` returns null
- API returns 401 Unauthorized
- Frontend receives 401, redirects to `/auth`
- User must re-authenticate
- No data loss (request fails cleanly)

### 7. Multiple Tabs with Different Sessions
**Scenario:** User logged in as "alice" in Tab A, "bob" in Tab B

**Handling:**
- Each tab has separate session cookie (shouldn't happen with HttpOnly)
- Latest login overwrites cookie
- All tabs now authenticated as latest user
- Inconsistent state possible
- **Mitigation**: Check session on every API call

### 8. User Deletes Passkey from Device
**Scenario:** User removes passkey from Keychain/Password Manager

**Handling:**
- User cannot login (no passkey available)
- Error: "No passkey found"
- User must register again (new account or same username if deleted)
- Old authenticator record orphaned in database
- **Future enhancement**: Account recovery flow

### 9. Cross-Origin Authentication Attempt
**Scenario:** Attacker tries to use credential on phishing site

**Handling:**
- WebAuthn validates `expectedOrigin`
- Verification fails if origin doesn't match
- Login rejected
- Phishing-resistant by design

### 10. Concurrent Logins from Same User
**Scenario:** User logs in on Device A and Device B simultaneously

**Handling:**
- Both devices have separate JWT tokens
- Both sessions valid
- Logging out on Device A doesn't affect Device B
- Authenticator counter increments separately (one per login)
- No conflict

### 11. Username Contains Special Characters
**Scenario:** User enters username with spaces or symbols

**Handling:**
- Validation regex rejects: `/^[a-zA-Z0-9_]+$/`
- Error: "Username must be alphanumeric"
- User must choose valid username
- Prevents SQL injection, XSS

### 12. Very Long Username
**Scenario:** User enters 100-character username

**Handling:**
- Validation checks length: 3-30 characters
- Error: "Username must be 3-30 characters"
- Registration blocked
- Database constraint prevents overflow

### 13. Case-Sensitive Username Collision
**Scenario:** User "Alice" exists, user tries to register "alice"

**Handling:**
- Database stores usernames case-sensitively
- "Alice" and "alice" are different users
- **Alternative**: Convert to lowercase before storage
- **Recommendation**: Case-insensitive uniqueness check

### 14. Logout from Already Logged Out State
**Scenario:** User clicks Logout when not authenticated

**Handling:**
- `/api/auth/logout` clears cookie regardless
- No error thrown
- Redirects to `/auth`
- Idempotent operation

### 15. Hardware Security Key Removed Mid-Authentication
**Scenario:** User removes YubiKey during authentication

**Handling:**
- Browser throws error (device disconnected)
- Authentication fails
- User prompted to retry
- No database changes

---

## Acceptance Criteria

### Functional Requirements

#### FR1: User Registration
- [ ] Auth page accessible at `/auth` route
- [ ] Username input accepts 3-30 alphanumeric characters
- [ ] "Register" button triggers WebAuthn ceremony
- [ ] Browser prompts for biometric/security key
- [ ] User account created on successful registration
- [ ] Authenticator record stored in database
- [ ] JWT session created and stored in cookie
- [ ] User redirected to `/` after registration

#### FR2: User Login
- [ ] Auth page shows login form
- [ ] Username input autocompletes saved usernames
- [ ] "Login" button triggers authentication
- [ ] Browser prompts for biometric verification
- [ ] Signature verified against stored public key
- [ ] JWT session created on success
- [ ] User redirected to `/` after login

#### FR3: Session Management
- [ ] Session stored in HTTP-only cookie
- [ ] Cookie has Secure flag (production)
- [ ] Cookie has SameSite=Lax
- [ ] Session expires after 7 days
- [ ] JWT contains user ID and username
- [ ] Session validated on each API request

#### FR4: Route Protection
- [ ] Middleware intercepts requests to `/` and `/calendar`
- [ ] Valid session allows access
- [ ] Invalid session redirects to `/auth`
- [ ] API routes return 401 without valid session
- [ ] Public routes accessible without auth

#### FR5: Logout
- [ ] Logout button visible when authenticated
- [ ] Clicking logout clears session cookie
- [ ] User redirected to `/auth`
- [ ] Subsequent requests require re-authentication

#### FR6: Error Handling
- [ ] "User already exists" error shown on duplicate username
- [ ] "User not found" error on invalid login username
- [ ] "Verification failed" on invalid credentials
- [ ] "WebAuthn not supported" on incompatible browsers
- [ ] "Operation canceled" when user dismisses prompt

#### FR7: Multi-Authenticator Support
- [ ] User can register multiple authenticators
- [ ] Each authenticator stored separately
- [ ] Login works with any registered authenticator
- [ ] Counter updated after each authentication

#### FR8: Security
- [ ] Credentials never transmitted (only public key)
- [ ] Private key never leaves device
- [ ] Challenge prevents replay attacks
- [ ] Origin validation prevents phishing
- [ ] Counter prevents authenticator cloning

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Registration completes < 5 seconds
- [ ] Login completes < 3 seconds
- [ ] Session validation < 50ms
- [ ] Middleware overhead < 10ms

#### NFR2: Security
- [ ] JWT signed with HS256
- [ ] Secret key stored in environment variable
- [ ] HTTP-only cookies prevent XSS
- [ ] SameSite prevents CSRF
- [ ] HTTPS enforced in production

#### NFR3: Compatibility
- [ ] Works in Chrome 67+
- [ ] Works in Firefox 60+
- [ ] Works in Safari 13+
- [ ] Works in Edge 18+
- [ ] Supports platform and cross-platform authenticators

#### NFR4: Usability
- [ ] Clear error messages
- [ ] Intuitive auth flow
- [ ] No password management required
- [ ] Fast biometric authentication

#### NFR5: Data Integrity
- [ ] User-authenticator relationship maintained
- [ ] CASCADE delete removes authenticators with user
- [ ] Counter increments prevent replay
- [ ] Credential ID uniqueness enforced

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/01-authentication.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('WebAuthn Authentication', () => {
  test.beforeEach(async ({ page, context }) => {
    // Enable virtual authenticator
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Add virtual authenticator for WebAuthn
    const client = await context.newCDPSession(page);
    await client.send('WebAuthn.enable');
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    });
  });

  test('should show auth page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to /auth
    await expect(page).toHaveURL('/auth');
    
    // Should show auth form
    await expect(page.locator('h1:has-text("Todo App")')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should register new user with passkey', async ({ page }) => {
    await page.goto('/auth');
    
    // Enter username
    await page.fill('input[type="text"]', 'testuser');
    
    // Click register
    await page.click('button:has-text("Register")');
    
    // Wait for redirect to main page
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Should see main todo page
    await expect(page.locator('text=Add a new todo')).toBeVisible();
  });

  test('should show error for duplicate username', async ({ page }) => {
    // Register first user
    await page.goto('/auth');
    await page.fill('input[type="text"]', 'duplicate');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/auth');
    
    // Try to register same username
    await page.fill('input[type="text"]', 'duplicate');
    await page.click('button:has-text("Register")');
    
    // Should show error
    await expect(page.locator('text=User already exists')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // Register user first
    await page.goto('/auth');
    await page.fill('input[type="text"]', 'loginuser');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/auth');
    
    // Login with same username
    await page.fill('input[type="text"]', 'loginuser');
    await page.click('button:has-text("Login")');
    
    // Should redirect to main page
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show error for non-existent user login', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="text"]', 'nonexistent');
    await page.click('button:has-text("Login")');
    
    // Should show error
    await expect(page.locator('text=User not found')).toBeVisible();
  });

  test('should logout and clear session', async ({ page }) => {
    // Register and login
    await page.goto('/auth');
    await page.fill('input[type="text"]', 'logoutuser');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
    
    // Try to access protected route
    await page.goto('/');
    
    // Should redirect back to auth
    await expect(page).toHaveURL('/auth');
  });

  test('should protect calendar route', async ({ page }) => {
    await page.goto('/calendar');
    
    // Should redirect to auth
    await expect(page).toHaveURL('/auth');
  });

  test('should validate username length', async ({ page }) => {
    await page.goto('/auth');
    
    // Too short
    await page.fill('input[type="text"]', 'ab');
    await page.click('button:has-text("Register")');
    
    await expect(page.locator('text=Username must be 3-30 characters')).toBeVisible();
  });

  test('should validate username characters', async ({ page }) => {
    await page.goto('/auth');
    
    // Invalid characters
    await page.fill('input[type="text"]', 'user@name!');
    await page.click('button:has-text("Register")');
    
    await expect(page.locator('text=Username must be alphanumeric')).toBeVisible();
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Register
    await page.goto('/auth');
    await page.fill('input[type="text"]', 'persistuser');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');
    
    // Reload page
    await page.reload();
    
    // Should still be on main page (session persisted)
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Add a new todo')).toBeVisible();
  });

  test('should allow API requests with valid session', async ({ page }) => {
    // Register
    await page.goto('/auth');
    await page.fill('input[type="text"]', 'apiuser');
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/');
    
    // Try to create a todo (requires authentication)
    await page.fill('input[placeholder="What needs to be done?"]', 'Test Todo');
    await page.click('button:has-text("Add")');
    
    // Todo should be created (no 401 error)
    await expect(page.locator('text=Test Todo')).toBeVisible();
  });

  test('should reject API requests without session', async ({ page, context }) => {
    // Make API request without session
    const response = await context.request.get('/api/todos');
    
    // Should return 401
    expect(response.status()).toBe(401);
  });
});
```

### Unit Tests

Create `tests/unit/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { userDB, authenticatorDB } from '@/lib/db';

describe('User Database', () => {
  beforeEach(() => {
    // Clear users for testing
    db.exec('DELETE FROM users');
  });

  it('should create user with unique username', () => {
    const user = userDB.create({ username: 'testuser' });
    
    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBe('testuser');
    expect(user.created_at).toBeTruthy();
  });

  it('should prevent duplicate usernames', () => {
    userDB.create({ username: 'duplicate' });
    
    expect(() => {
      userDB.create({ username: 'duplicate' });
    }).toThrow();
  });

  it('should get user by username', () => {
    const created = userDB.create({ username: 'findme' });
    const found = userDB.getByUsername('findme');
    
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  it('should return null for non-existent username', () => {
    const user = userDB.getByUsername('nonexistent');
    expect(user).toBeNull();
  });
});

describe('Authenticator Database', () => {
  let userId: number;

  beforeEach(() => {
    db.exec('DELETE FROM users');
    const user = userDB.create({ username: 'authuser' });
    userId = user.id;
  });

  it('should create authenticator for user', () => {
    const auth = authenticatorDB.create({
      userId,
      credentialId: 'cred123',
      publicKey: 'pubkey123',
      counter: 0,
      transports: ['internal'],
    });
    
    expect(auth.id).toBeGreaterThan(0);
    expect(auth.user_id).toBe(userId);
    expect(auth.credential_id).toBe('cred123');
  });

  it('should get authenticators by user ID', () => {
    authenticatorDB.create({
      userId,
      credentialId: 'cred1',
      publicKey: 'pub1',
      counter: 0,
      transports: ['usb'],
    });
    
    authenticatorDB.create({
      userId,
      credentialId: 'cred2',
      publicKey: 'pub2',
      counter: 0,
      transports: ['internal'],
    });
    
    const authenticators = authenticatorDB.getByUserId(userId);
    expect(authenticators).toHaveLength(2);
  });

  it('should update counter', () => {
    const auth = authenticatorDB.create({
      userId,
      credentialId: 'cred456',
      publicKey: 'pub456',
      counter: 0,
      transports: ['nfc'],
    });
    
    authenticatorDB.updateCounter(auth.id, 5);
    
    const updated = authenticatorDB.getByCredentialId('cred456');
    expect(updated?.counter).toBe(5);
  });

  it('should cascade delete authenticators with user', () => {
    authenticatorDB.create({
      userId,
      credentialId: 'cred789',
      publicKey: 'pub789',
      counter: 0,
      transports: ['ble'],
    });
    
    // Delete user
    db.exec(`DELETE FROM users WHERE id = ${userId}`);
    
    // Authenticator should be deleted
    const auth = authenticatorDB.getByCredentialId('cred789');
    expect(auth).toBeNull();
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Password Authentication
- Traditional username/password login
- Password reset flows
- Password strength validation
- **Reason:** WebAuthn only, no password fallback

### 2. Email Verification
- Email-based account verification
- Email confirmation links
- Email notifications
- **Reason:** Passwordless flow doesn't require email

### 3. Account Recovery
- "Forgot passkey" flow
- Recovery codes/backup codes
- Admin password reset
- **Reason:** Out of MVP scope, future enhancement

### 4. Authenticator Management UI
- View registered authenticators
- Delete specific authenticators
- Rename authenticators
- **Reason:** Advanced feature, single authenticator sufficient for MVP

### 5. Two-Factor Authentication (2FA)
- Additional authentication layer
- TOTP codes
- SMS verification
- **Reason:** WebAuthn already provides strong authentication

### 6. Social Login
- "Sign in with Google"
- "Sign in with GitHub"
- OAuth providers
- **Reason:** Passwordless WebAuthn is simpler

### 7. User Profile Management
- Update username
- Profile pictures
- Bio/description
- **Reason:** Todo app focused on tasks, not user profiles

### 8. Role-Based Access Control (RBAC)
- Admin vs. user roles
- Permissions system
- Team/organization management
- **Reason:** Single-user application

### 9. Session Revocation
- Manual session invalidation
- "Logout all devices"
- Session activity log
- **Reason:** Simple session management sufficient

### 10. Rate Limiting
- Login attempt throttling
- Brute force protection
- IP-based blocking
- **Reason:** WebAuthn resistant to brute force by design

### 11. Audit Logging
- Login history
- Authentication events
- Security logs
- **Reason:** Not required for MVP

### 12. Biometric Enrollment
- Custom biometric registration
- Biometric template storage
- **Reason:** Handled by platform (iOS, Android, Windows)

---

## Success Metrics

### User Engagement
- **Target:** 90% of users successfully register on first attempt
- **Target:** 95% of users successfully login on first attempt
- **Target:** < 5 seconds average registration time
- **Target:** < 3 seconds average login time

### Security
- **Target:** Zero password-related security incidents
- **Target:** 100% of sessions use HTTP-only cookies
- **Target:** Zero phishing-related credential theft
- **Target:** 100% origin validation on authentication

### Reliability
- **Target:** 99.9% authentication success rate
- **Target:** < 1% WebAuthn errors (browser compatibility)
- **Target:** Zero session corruption issues
- **Target:** 100% E2E test pass rate

### User Satisfaction
- **Target:** Users prefer passwordless over traditional login (qualitative)
- **Target:** < 2% support requests related to authentication
- **Target:** Zero "forgot password" requests

---

## Implementation Notes

### Development Order
1. **Phase 1: Database Setup**
   - Create users and authenticators tables
   - Add indexes for performance
   - Test CASCADE delete behavior

2. **Phase 2: Backend API**
   - Implement register-options endpoint
   - Implement register-verify endpoint
   - Implement login-options endpoint
   - Implement login-verify endpoint
   - Implement logout endpoint

3. **Phase 3: Session Management**
   - Create auth.ts library
   - Implement JWT creation/verification
   - Implement cookie management
   - Test session persistence

4. **Phase 4: Middleware**
   - Create middleware.ts
   - Implement route protection
   - Test redirects and session validation

5. **Phase 5: Frontend**
   - Build auth page UI
   - Integrate @simplewebauthn/browser
   - Implement registration flow
   - Implement login flow
   - Add error handling

6. **Phase 6: Integration**
   - Add logout button to main app
   - Update API routes to use getSession()
   - Test end-to-end flows

7. **Phase 7: Testing**
   - Write E2E tests (12 test cases)
   - Write unit tests for database
   - Test across browsers
   - Security testing

### Dependencies
- **Requires:** SQLite database (better-sqlite3)
- **Requires:** JWT library (jose)
- **Requires:** @simplewebauthn/server (backend)
- **Requires:** @simplewebauthn/browser (frontend)
- **Foundational:** All other features depend on authentication

### Environment Variables

```bash
# .env.local

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-change-in-production

# WebAuthn configuration
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000

# Production
# NEXT_PUBLIC_RP_ID=todoapp.example.com
# NEXT_PUBLIC_ORIGIN=https://todoapp.example.com
```

### Security Considerations
- **JWT Secret:** Use strong random secret (32+ bytes)
- **HTTPS:** Enforce HTTPS in production (Secure cookie flag)
- **Origin:** Validate origin matches expected domain
- **Challenge:** Generate cryptographically random challenges
- **Counter:** Always validate and update authenticator counter
- **SQL Injection:** Use parameterized queries (prepared statements)

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
