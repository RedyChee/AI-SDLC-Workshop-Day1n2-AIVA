# WebAuthn/Passkeys Authentication - Implementation Guide

## Overview

This todo application implements **passwordless authentication** using WebAuthn/Passkeys technology. Users can register and login using their device's biometric authentication (Face ID, Touch ID, fingerprint) or hardware security keys (YubiKey), eliminating the need for passwords entirely.

## Features Implemented

✅ **Passwordless Registration** - Create accounts with biometrics  
✅ **Passwordless Login** - Authenticate using passkeys  
✅ **Session Management** - JWT-based sessions with HTTP-only cookies (7-day expiry)  
✅ **Route Protection** - Middleware guards `/` and `/calendar` routes  
✅ **Multi-Device Support** - Passkeys sync via platform providers (iCloud, Google)  
✅ **Security Key Support** - Hardware authenticators (YubiKey, Titan Key)  
✅ **Logout Functionality** - Clear sessions and redirect to auth page

## Architecture

### Stack
- **Frontend**: React 19, Next.js 15, `@simplewebauthn/browser`
- **Backend**: Next.js API routes, `@simplewebauthn/server`
- **Database**: SQLite (`better-sqlite3`) with `users` and `authenticators` tables
- **Sessions**: JWT with HTTP-only cookies, 7-day expiry

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Authenticators table (WebAuthn credentials)
CREATE TABLE authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Files Structure

```
lib/
  auth.ts                     # Session management (JWT, cookies)
  db.ts                       # Database operations (userDB, authenticatorDB)

middleware.ts                 # Route protection middleware

app/
  auth/
    page.tsx                  # Auth UI (registration/login)
  api/
    auth/
      register-options/
        route.ts              # Generate WebAuthn registration challenge
      register-verify/
        route.ts              # Verify registration and create user
      login-options/
        route.ts              # Generate WebAuthn login challenge
      login-verify/
        route.ts              # Verify login and create session
      logout/
        route.ts              # Clear session cookie
```

## Authentication Flow

### Registration Flow

1. User enters username on `/auth` page
2. Frontend calls `POST /api/auth/register-options` with username
3. Backend generates WebAuthn challenge using `@simplewebauthn/server`
4. Frontend calls `navigator.credentials.create()` via `@simplewebauthn/browser`
5. Browser prompts for biometric (Face ID, Touch ID, fingerprint) or security key
6. User authenticates with device
7. Browser generates public/private key pair (private key stays on device)
8. Frontend sends credential to `POST /api/auth/register-verify`
9. Backend verifies credential, creates user and authenticator records
10. Backend generates JWT session token, sets HTTP-only cookie
11. Frontend redirects to main app (`/`)

### Login Flow

1. User enters username on `/auth` page
2. Frontend calls `POST /api/auth/login-options` with username
3. Backend retrieves user's authenticators, generates challenge
4. Frontend calls `navigator.credentials.get()` via `@simplewebauthn/browser`
5. Browser prompts for biometric or security key
6. User authenticates with device
7. Browser signs challenge with private key
8. Frontend sends signed credential to `POST /api/auth/login-verify`
9. Backend verifies signature, updates counter (anti-replay)
10. Backend generates JWT session token, sets HTTP-only cookie
11. Frontend redirects to main app (`/`)

### Session Validation (Middleware)

1. User navigates to protected route (`/`, `/calendar`)
2. Middleware extracts session cookie
3. Middleware verifies JWT signature and expiration
4. Middleware checks user exists in database
5. If valid: Allow request to proceed
6. If invalid: Redirect to `/auth?returnTo=<original-path>`

### Logout Flow

1. User clicks "Logout" button
2. Frontend calls `POST /api/auth/logout`
3. Backend clears session cookie
4. Frontend redirects to `/auth`

## API Endpoints

### POST /api/auth/register-options

Generate WebAuthn registration challenge.

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
    "challenge": "base64-encoded-challenge",
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

**Errors:**
- `400` - Invalid username format
- `409` - User already exists

### POST /api/auth/register-verify

Verify WebAuthn registration and create user.

**Request:**
```json
{
  "username": "alice",
  "challenge": "base64-challenge",
  "credential": {
    "id": "credential-id",
    "rawId": "...",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```

**Sets Cookie:**
```
session=<jwt-token>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

### POST /api/auth/login-options

Generate WebAuthn authentication challenge.

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
    "challenge": "base64-challenge",
    "rpId": "localhost",
    "allowCredentials": [
      {
        "id": "credential-id",
        "type": "public-key",
        "transports": ["internal", "hybrid"]
      }
    ],
    "timeout": 60000,
    "userVerification": "preferred"
  },
  "userId": 1
}
```

**Errors:**
- `400` - Username required
- `404` - User not found

### POST /api/auth/login-verify

Verify WebAuthn authentication and create session.

**Request:**
```json
{
  "userId": 1,
  "challenge": "base64-challenge",
  "credential": {
    "id": "credential-id",
    "rawId": "...",
    "response": {
      "authenticatorData": "...",
      "clientDataJSON": "...",
      "signature": "..."
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```

**Sets Cookie:** Same as register-verify

### POST /api/auth/logout

Clear session cookie.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Environment Configuration

### .env.local

```env
# JWT Secret - Change in production!
JWT_SECRET=your-secret-key-change-in-production-use-long-random-string

# WebAuthn Configuration
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

### Production Setup

For production deployment (e.g., `https://todoapp.com`):

```env
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NEXT_PUBLIC_RP_ID=todoapp.com
NEXT_PUBLIC_ORIGIN=https://todoapp.com
```

**Important:** 
- `RP_ID` must be the domain without protocol/port
- `ORIGIN` must match the actual URL in the browser
- Mismatch will cause WebAuthn verification to fail

## Security Considerations

### ✅ Implemented

- **HTTP-only cookies** - JavaScript cannot access session tokens
- **SameSite=Lax** - CSRF protection
- **Secure flag in production** - HTTPS-only cookies
- **Counter validation** - Prevents authenticator cloning/replay attacks
- **Challenge-response** - Each auth attempt uses unique challenge
- **Database validation** - User existence checked on every session
- **7-day expiry** - Sessions auto-expire after inactivity

### 🔒 Best Practices

- **JWT Secret**: Generate with `openssl rand -base64 32`
- **HTTPS in production**: Required for WebAuthn to work
- **RP_ID validation**: Must match deployment domain
- **User enumeration**: Login returns same error for non-existent users
- **Rate limiting**: Consider adding to prevent brute force (future enhancement)

## Browser Compatibility

✅ **Chrome 67+** (desktop and mobile)  
✅ **Firefox 60+** (desktop and mobile)  
✅ **Safari 13+** (macOS and iOS)  
✅ **Edge 18+** (Windows)

WebAuthn is a W3C standard with wide support. Older browsers will show an error.

## Testing

### Manual Testing

1. **Registration:**
   ```
   1. Navigate to http://localhost:3000
   2. Redirected to /auth
   3. Enter username: "testuser"
   4. Click "Register with Passkey"
   5. Browser prompts for biometric
   6. Authenticate with Touch ID/Face ID/fingerprint
   7. Redirected to main app
   ```

2. **Login:**
   ```
   1. Logout from app
   2. Enter same username: "testuser"
   3. Click "Login with Passkey"
   4. Authenticate with biometric
   5. Logged in to app
   ```

3. **Session Persistence:**
   ```
   1. Login to app
   2. Close browser
   3. Re-open browser and navigate to app
   4. Should still be logged in (within 7 days)
   ```

### Playwright E2E Tests

Tests will use virtual authenticators:

```typescript
// playwright.config.ts
use: {
  launchOptions: {
    args: ['--enable-virtual-authenticators'],
  },
},
```

See `tests/01-authentication.spec.ts` for comprehensive test coverage.

## Development-Only Dev Login

For testing without WebAuthn during development:

```bash
curl -X POST http://localhost:3000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"username":"devuser"}'
```

**Note:** Disabled in production (`NODE_ENV=production`)

## Troubleshooting

### Issue: "WebAuthn not supported"

**Cause:** Browser doesn't support WebAuthn  
**Solution:** Use Chrome 67+, Firefox 60+, Safari 13+, or Edge 18+

### Issue: "Registration verification failed"

**Cause:** RP_ID or ORIGIN mismatch  
**Solution:** Ensure `.env.local` values match your actual URL

### Issue: "User not found" during login

**Cause:** Case-sensitive username or user doesn't exist  
**Solution:** Usernames are case-sensitive. Verify username from registration.

### Issue: "Session expired" constantly

**Cause:** System time drift or JWT secret changed  
**Solution:** Check system time. Don't change JWT_SECRET in production.

### Issue: Passkey works on phone but not laptop

**Cause:** Cross-device passkeys require proximity and Bluetooth  
**Solution:** Ensure devices are nearby and Bluetooth enabled, or register passkey on each device

## Advanced Features (Future Enhancements)

- [ ] **Authenticator Management** - View/delete registered passkeys
- [ ] **Account Recovery** - Backup codes or recovery passkey
- [ ] **Remember Device** - Extended sessions for trusted devices
- [ ] **Rate Limiting** - Prevent brute force attacks
- [ ] **Audit Logging** - Track login attempts and sessions
- [ ] **Multi-Factor** - Combine passkeys with other factors

## References

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [Passkeys.dev](https://passkeys.dev/)
- [FIDO Alliance](https://fidoalliance.org/)

## Support

For issues or questions about the authentication system:

1. Check this documentation
2. Review PRP-11 (`PRPs/11-authentication.md`) for detailed requirements
3. Inspect browser console for WebAuthn errors
4. Verify environment variables are correct

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0  
**Implemented By:** AI-Augmented SDLC Workshop
