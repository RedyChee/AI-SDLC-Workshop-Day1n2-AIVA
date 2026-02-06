'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authenticatorCount, setAuthenticatorCount] = useState<number>(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate username
      if (!username.trim()) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }

      if (username.length < 3 || username.length > 30) {
        setError('Username must be 3-30 characters');
        setLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username must be alphanumeric (letters, numbers, underscores only)');
        setLoading(false);
        return;
      }

      // Step 1: Get registration options from server
      const optionsResponse = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to get registration options');
      }

      const { options } = await optionsResponse.json();

      // Step 2: Start WebAuthn registration ceremony (browser prompts for biometric)
      let credential;
      try {
        // Add timeout wrapper (60 seconds)
        const registrationPromise = startRegistration(options);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration timed out after 60 seconds. Please try again.')), 60000)
        );
        credential = await Promise.race([registrationPromise, timeoutPromise]);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Registration was cancelled. Please try again.');
        }
        if (err.message.includes('timed out')) {
          throw new Error(err.message);
        }
        throw new Error('WebAuthn registration failed: ' + err.message);
      }

      // Step 3: Send credential to server for verification
      const verifyResponse = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Registration verification failed');
      }

      // Success! Redirect to app
      router.push(returnTo);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate username
      if (!username.trim()) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }

      // Step 1: Get authentication options from server
      const optionsResponse = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to get login options');
      }

      const { options, userId } = await optionsResponse.json();

      // Step 2: Start WebAuthn authentication ceremony (browser prompts for biometric)
      let credential;
      try {
        // Add timeout wrapper (60 seconds)
        const authPromise = startAuthentication(options);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timed out after 60 seconds. Please try again or use the device you registered with.')), 60000)
        );
        credential = await Promise.race([authPromise, timeoutPromise]);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Authentication was cancelled. Please use the same device you registered with.');
        }
        if (err.message.includes('timed out')) {
          throw new Error(err.message);
        }
        throw new Error('WebAuthn authentication failed. Make sure you\'re using the device you registered with.');
      }

      // Step 3: Send credential to server for verification
      const verifyResponse = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Login verification failed');
      }

      // Success! Redirect to app
      router.push(returnTo);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const checkAuthenticators = async (username: string) => {
    if (!username.trim()) return;
    
    try {
      const response = await fetch('/api/auth/authenticators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthenticatorCount(data.count);
      }
    } catch (err) {
      console.error('Failed to check authenticators:', err);
    }
  };

  const handleResetPasskey = async () => {
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/reset-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(),
          confirmUsername: confirmUsername.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset passkey');
      }

      // Success - reset UI and switch to register mode
      setShowResetModal(false);
      setConfirmUsername('');
      setAuthenticatorCount(0);
      setMode('register');
      setError('');
      alert(data.message);
    } catch (err: any) {
      alert(err.message || 'Failed to reset passkey');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register') {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Todo App
            </h1>
            <p className="text-gray-600">
              {mode === 'register' 
                ? 'Create an account with passkeys' 
                : 'Login with your passkey'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
              {error.includes('device you registered with') && (
                <p className="text-xs text-red-700 mt-2">
                  💡 Tip: Passkeys are device-specific. If you can't access your original device, please contact support or register a new account.
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Check authenticators when username changes (for login mode)
                  if (mode === 'login' && e.target.value.length >= 3) {
                    checkAuthenticators(e.target.value);
                  }
                }}
                onBlur={() => {
                  // Also check on blur
                  if (mode === 'login' && username.length >= 3) {
                    checkAuthenticators(username);
                  }
                }}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
                autoComplete="username webauthn"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                3-30 characters, letters, numbers, and underscores only
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : mode === 'register' ? (
                'Register with Passkey'
              ) : (
                'Login with Passkey'
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setAuthenticatorCount(0);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>

          {/* Authenticator Info & Reset Option (Login mode only) */}
          {mode === 'login' && authenticatorCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>🔑 {authenticatorCount} passkey(s) registered</strong>
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Use the device you registered with to login.
              </p>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium underline"
                disabled={loading}
              >
                Can't access your device? Reset passkey
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>🔐 Passwordless Authentication</strong>
              <br />
              Use your device&apos;s biometric authentication (Face ID, Touch ID, fingerprint)
              or security key. No passwords to remember!
            </p>
          </div>
        </div>

        {/* Browser Compatibility Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            Requires a modern browser with WebAuthn support
            <br />
            (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
          </p>
        </div>
      </div>

      {/* Reset Passkey Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Passkey</h2>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                ⚠️ <strong>Warning:</strong> This will delete all passkeys for this account. 
                You will need to register again with a new passkey.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm username to reset:
              </label>
              <input
                type="text"
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                placeholder="Enter username to confirm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                disabled={resetLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must match username: <strong>{username}</strong>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmUsername('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPasskey}
                disabled={resetLoading || confirmUsername !== username}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Resetting...' : 'Reset Passkey'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
