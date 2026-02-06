# PRP 11: Authentication (WebAuthn/Passkeys)

## Feature Overview

Passwordless authentication using the **WebAuthn/Passkeys** standard for secure, modern access control. Users register and log in using biometric authenticators (fingerprint, Face ID) or security keys — no passwords involved. Sessions are managed via JWT tokens stored as HTTP-only cookies with a 7-day expiry. A middleware layer protects the `/` and `/calendar` routes, redirecting unauthenticated users to the login page.

---

## User Stories

1. **As a user**, I want to register with my username and biometric authentication so that I can create a secure account without a password.
2. **As a user**, I want to log in using my passkey so that I can access my todos quickly and securely.
3. **As a user**, I want my session to persist for 7 days so that I don't have to log in frequently.
4. **As a user**, I want to log out so that I can secure my account when I'm done.
5. **As a user**, I want protected routes to redirect me to login so that unauthorized access is prevented.
6. **As a user**, I want clear feedback during registration and login so that I know if the process succeeds or fails.

---

## User Flow

### Registration
1. User navigates to the login/register page
2. User enters a unique username in the text input
3. User clicks **"Register"**
4. App calls `/api/auth/register-options` to get a WebAuthn challenge
5. Browser prompts user for biometric authentication (fingerprint, Face ID, or security key)
6. User authenticates with their device
7. App sends the authenticator response to `/api/auth/register-verify`
8. Server verifies the response, creates the user and authenticator records
9. Server creates a JWT session cookie (7-day expiry, HTTP-only)
10. User is redirected to the main todo page (`/`)

### Login
1. User navigates to the login/register page
2. User enters their existing username
3. User clicks **"Login"**
4. App calls `/api/auth/login-options` to get a WebAuthn challenge
5. Browser prompts user for biometric authentication
6. User authenticates with their stored passkey
7. App sends the authenticator response to `/api/auth/login-verify`
8. Server verifies the response against stored credentials
9. Server creates a JWT session cookie (7-day expiry, HTTP-only)
10. User is redirected to the main todo page (`/`)

### Logout
1. User clicks **"Logout"** button (top-right corner)
2. App calls `/api/auth/logout`
3. Server clears the session cookie
4. User is redirected to the login page

### Accessing Protected Routes
1. User tries to access `/` or `/calendar`
2. Middleware checks for valid session cookie
3. **If valid**: Request continues to the page
4. **If invalid/missing**: User redirected to login page

---

## Technical Requirements

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- WebAuthn authenticators (one-to-many with users)
CREATE TABLE authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT,                  -- JSON array of transport types
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Challenges table (temporary, for WebAuthn ceremony)
CREATE TABLE challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  challenge TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Key points:**
- Each user can have multiple authenticators (passkeys)
- `credential_id` and `credential_public_key` stored as base64url-encoded strings
- `counter` field tracks authenticator usage (replay attack prevention)
- `challenges` table stores temporary WebAuthn challenges during ceremonies
- **Always use `?? 0` for counter field** to handle undefined values

### TypeScript Interfaces

```typescript
interface User {
  id: number;
  username: string;
  created_at: string;
}

interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;     // base64url-encoded
  credential_public_key: string; // base64url-encoded
  counter: number;
  transports: string | null;  // JSON array
  created_at: string;
}

interface Session {
  userId: number;
  username: string;
}
```

### Dependencies

```json
{
  "@simplewebauthn/server": "^11.0.0",
  "@simplewebauthn/browser": "^11.0.0",
  "jose": "^5.0.0"
}
```

- `@simplewebauthn/server` — server-side WebAuthn verification
- `@simplewebauthn/browser` — client-side WebAuthn browser API wrapper
- `jose` — JWT creation and verification

### API Endpoints

#### `POST /api/auth/register-options`
- **Auth**: Not required
- **Body**: `{ "username": "string" }`
- **Response**: `200 OK` → WebAuthn `PublicKeyCredentialCreationOptionsJSON`
- **Behavior**:
  1. Validate username is not empty and not already taken
  2. Generate registration options using `generateRegistrationOptions()` from `@simplewebauthn/server`
  3. Store challenge in `challenges` table (associated with username)
  4. Return options to client

```typescript
import { generateRegistrationOptions } from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  rpName: 'Todo App',
  rpID: hostname,                    // e.g., 'localhost'
  userName: username,
  attestationType: 'none',
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'preferred',
  },
});
```

#### `POST /api/auth/register-verify`
- **Auth**: Not required
- **Body**: `{ "username": "string", "response": RegistrationResponseJSON }`
- **Response**: `200 OK` → `{ verified: true }` + Set-Cookie (JWT)
- **Behavior**:
  1. Retrieve stored challenge from `challenges` table
  2. Verify registration response using `verifyRegistrationResponse()` from `@simplewebauthn/server`
  3. If verified:
     - Create user in `users` table
     - Store authenticator in `authenticators` table
     - Create JWT session cookie
  4. Clean up challenge from `challenges` table

```typescript
import { verifyRegistrationResponse } from '@simplewebauthn/server';

const verification = await verifyRegistrationResponse({
  response: body.response,
  expectedChallenge: storedChallenge,
  expectedOrigin: origin,
  expectedRPID: rpID,
});

if (verification.verified && verification.registrationInfo) {
  const { credential } = verification.registrationInfo;
  // Store credential with counter ?? 0
}
```

#### `POST /api/auth/login-options`
- **Auth**: Not required
- **Body**: `{ "username": "string" }`
- **Response**: `200 OK` → WebAuthn `PublicKeyCredentialRequestOptionsJSON`
- **Behavior**:
  1. Look up user by username
  2. Fetch user's authenticators from DB
  3. Generate authentication options using `generateAuthenticationOptions()`
  4. Store challenge in `challenges` table
  5. Return options to client

```typescript
import { generateAuthenticationOptions } from '@simplewebauthn/server';

const options = await generateAuthenticationOptions({
  rpID: hostname,
  allowCredentials: authenticators.map(auth => ({
    id: auth.credential_id,
    transports: auth.transports ? JSON.parse(auth.transports) : undefined,
  })),
  userVerification: 'preferred',
});
```

#### `POST /api/auth/login-verify`
- **Auth**: Not required
- **Body**: `{ "username": "string", "response": AuthenticationResponseJSON }`
- **Response**: `200 OK` → `{ verified: true }` + Set-Cookie (JWT)
- **Behavior**:
  1. Retrieve stored challenge and user's authenticator
  2. Verify authentication response using `verifyAuthenticationResponse()`
  3. If verified:
     - Update authenticator counter (`counter ?? 0`)
     - Create JWT session cookie
  4. Clean up challenge

```typescript
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const verification = await verifyAuthenticationResponse({
  response: body.response,
  expectedChallenge: storedChallenge,
  expectedOrigin: origin,
  expectedRPID: rpID,
  credential: {
    id: authenticator.credential_id,
    publicKey: isoBase64URL.toBuffer(authenticator.credential_public_key),
    counter: authenticator.counter ?? 0,
    transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
  },
});
```

#### `POST /api/auth/logout`
- **Auth**: Required
- **Response**: `200 OK` → clears session cookie
- **Behavior**: Sets the session cookie with an expired date to clear it

#### `GET /api/auth/session`
- **Auth**: Required
- **Response**: `200 OK` → `{ userId: number, username: string }` or `401`
- **Behavior**: Validates JWT from cookie, returns session data

### Session Management (lib/auth.ts)

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production');
const COOKIE_NAME = 'session';

export async function createSession(userId: number, username: string): Promise<void> {
  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as number, username: payload.username as string };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}
```

### Middleware (middleware.ts)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production');
const PROTECTED_ROUTES = ['/', '/calendar'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/', '/calendar'],
};
```

### Buffer Encoding (Credential Handling)

```typescript
import { isoBase64URL } from '@simplewebauthn/server/helpers';

// Encoding credential_id for storage
const credentialIdBase64 = isoBase64URL.fromBuffer(credential.id);

// Decoding credential_id for verification
const credentialIdBuffer = isoBase64URL.toBuffer(authenticator.credential_id);

// Public key encoding for storage
const publicKeyBase64 = isoBase64URL.fromBuffer(credential.publicKey);
```

### Client-Side WebAuthn (Login/Register Page)

```typescript
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Registration
const registerOptions = await fetch('/api/auth/register-options', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username }),
}).then(r => r.json());

const registrationResponse = await startRegistration({ optionsJSON: registerOptions });

const verifyResult = await fetch('/api/auth/register-verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, response: registrationResponse }),
}).then(r => r.json());

// Authentication
const loginOptions = await fetch('/api/auth/login-options', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username }),
}).then(r => r.json());

const authenticationResponse = await startAuthentication({ optionsJSON: loginOptions });

const loginResult = await fetch('/api/auth/login-verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, response: authenticationResponse }),
}).then(r => r.json());
```

---

## UI Components

### Login/Register Page (`/login`)
- **Username input**: Text field for entering username
- **"Register"** button: Initiates WebAuthn registration ceremony
- **"Login"** button: Initiates WebAuthn authentication ceremony
- **Status messages**: Success/error feedback
- **Visual design**: Centered card layout with app branding

### Logout Button
- **Location**: Top-right corner of main app pages
- **Label**: "Logout" with optional username display
- **Behavior**: Calls logout API, redirects to login page

### Authentication Status Indicators
- **Logged in**: Username displayed in header, logout button visible
- **Not logged in**: Redirected to login page by middleware

### Error Messages
- `"Username is required"` — empty username
- `"Username already taken"` — duplicate registration
- `"User not found"` — login with unregistered username
- `"Authentication failed"` — WebAuthn verification failure
- `"Registration failed"` — WebAuthn registration failure

---

## Edge Cases

1. **Empty username**: Reject with validation error
2. **Duplicate username on registration**: Reject — `UNIQUE` constraint on `users.username`
3. **Login with non-existent username**: Return error `"User not found"`
4. **WebAuthn not supported**: Show message that the browser doesn't support passkeys
5. **User cancels biometric prompt**: Handle error gracefully, show retry message
6. **Expired JWT**: Middleware redirects to login; user must re-authenticate
7. **Counter mismatch**: WebAuthn counter check prevents replay attacks; `counter ?? 0` handles undefined
8. **Multiple authenticators per user**: Supported — user can register multiple passkeys
9. **Cookie cleared manually**: Session lost; user redirected to login
10. **Concurrent sessions**: JWT is stateless; multiple devices can hold valid sessions
11. **HTTPS requirement**: WebAuthn requires secure context; works on localhost for development but needs HTTPS in production
12. **Challenge expiry**: Challenges should be cleaned up periodically; stale challenges rejected on verification
13. **`transports` field null**: Handle gracefully with optional chaining and `?? undefined`

---

## Acceptance Criteria

- [ ] User can register with a unique username and biometric/security key
- [ ] User cannot register with an already-taken username
- [ ] User cannot register with an empty username
- [ ] Registration creates user and authenticator records in the database
- [ ] User can log in with their passkey after registration
- [ ] Login with non-existent username shows appropriate error
- [ ] Successful login/registration creates a JWT session cookie (7-day expiry)
- [ ] JWT cookie is HTTP-only and secure (in production)
- [ ] User can log out (session cookie cleared)
- [ ] Protected routes (`/`, `/calendar`) redirect to login when not authenticated
- [ ] Protected routes allow access with valid session
- [ ] API routes return 401 for unauthenticated requests
- [ ] Authenticator counter updated on each login (`counter ?? 0`)
- [ ] Buffer encoding/decoding works correctly for credential_id and public keys
- [ ] Error messages are clear and appropriate for each failure mode
- [ ] WebAuthn ceremony (challenge → response → verify) completes successfully
- [ ] Login page renders correctly in both light and dark modes

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/01-authentication.spec.ts

test('should register a new user', async ({ page }) => {
  // Enter username, click Register, authenticate with virtual authenticator
  // Verify redirect to main page
});

test('should reject duplicate username registration', async ({ page }) => {
  // Register user "testuser", try registering "testuser" again, verify error
});

test('should reject empty username', async ({ page }) => {
  // Click Register without username, verify error message
});

test('should login with existing user', async ({ page }) => {
  // Register user, logout, login with same username, verify access
});

test('should reject login with non-existent user', async ({ page }) => {
  // Try logging in with unknown username, verify error
});

test('should redirect unauthenticated user to login', async ({ page }) => {
  // Navigate to / without session, verify redirect to /login
});

test('should redirect from calendar without auth', async ({ page }) => {
  // Navigate to /calendar without session, verify redirect to /login
});

test('should logout and clear session', async ({ page }) => {
  // Login, click Logout, verify redirect to login page
  // Try accessing /, verify redirect to login
});

test('should persist session across page reload', async ({ page }) => {
  // Login, reload page, verify still logged in
});
```

### Virtual WebAuthn Authenticator

Tests use Chromium's virtual authenticator:

```typescript
// playwright.config.ts
{
  use: {
    launchOptions: {
      args: [
        '--enable-web-authentication-testing-api',
      ],
    },
    timezoneId: 'Asia/Singapore',
  },
}
```

```typescript
// tests/helpers.ts — Virtual authenticator setup
async function setupVirtualAuthenticator(page: Page) {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send('WebAuthn.enable');
  await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
}
```

---

## Out of Scope

- Traditional password-based authentication
- OAuth/social login (Google, GitHub, etc.)
- Multi-factor authentication (WebAuthn IS the factor)
- Account recovery / password reset (no passwords)
- Email verification
- Username change after registration
- User profile management
- Admin/role-based access control
- API key authentication
- Rate limiting on auth endpoints
- Account deletion
- Session revocation (JWT is stateless)
- TOTP/OTP codes

---

## Success Metrics

- Registration and login complete in < 3 seconds (excluding biometric prompt time)
- Zero authentication bypass vulnerabilities
- JWT session correctly expires after 7 days
- Middleware correctly protects all specified routes
- WebAuthn counter prevents replay attacks
- Virtual authenticator tests pass reliably in CI/CD
- No plaintext credential storage (all base64url encoded)
- Clear, actionable error messages for all failure modes
- Smooth user experience with biometric prompts
