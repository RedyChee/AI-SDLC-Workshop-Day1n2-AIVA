'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

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
        credential = await startRegistration(options);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Registration was cancelled or timed out');
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
        credential = await startAuthentication(options);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Authentication was cancelled or timed out');
        }
        throw new Error('WebAuthn authentication failed: ' + err.message);
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
              <p className="text-sm text-red-800">⚠️ {error}</p>
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
                onChange={(e) => setUsername(e.target.value)}
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
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>

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
    </div>
  );
}
