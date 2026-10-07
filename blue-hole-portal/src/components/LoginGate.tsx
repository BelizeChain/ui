'use client';

/**
 * Authentication gate for the Blue Hole Portal.
 *
 * Rendered by the root layout in place of the dashboard whenever there is no
 * valid session. Access requires a Polkadot.js account that:
 *
 *   1. proves control of the address by signing a one-time challenge, and
 *   2. holds a BelizeID KYC level at or above the required threshold.
 *
 * The server re-checks both; nothing here is trusted.
 */

import { useCallback, useState } from 'react';
import { useWallet } from '@belizechain/shared';
import { stringToHex } from '@polkadot/util';
import { ShieldCheck, LockKey } from 'phosphor-react';

type Phase = 'idle' | 'signing' | 'error';

interface GateError {
  message: string;
  detail?: string;
}

function describeError(code: string, payload: Record<string, unknown>): GateError {
  switch (code) {
    case 'insufficient_kyc': {
      const level = Number(payload.level ?? 0);
      const required = Number(payload.required ?? 2);
      return {
        message: 'BelizeID verification required',
        detail: `This account is at KYC level ${level}. The Portal requires level ${required}. Complete verification in Maya Wallet and try again.`,
      };
    }
    case 'kyc_lookup_unavailable':
      return {
        message: 'Cannot reach the blockchain',
        detail: 'Your identity could not be checked. Please try again in a moment.',
      };
    case 'invalid_signature':
      return { message: 'Signature did not match', detail: 'Please try signing in again.' };
    case 'no_active_challenge':
    case 'challenge_expired':
      return { message: 'The request timed out', detail: 'Please try signing in again.' };
    case 'auth_not_configured':
      return {
        message: 'Portal authentication is not configured',
        detail: 'An administrator must set AUTH_SESSION_SECRET on the server.',
      };
    default:
      return { message: 'Sign-in failed', detail: 'Please try again.' };
  }
}

export function LoginGate() {
  const { isConnected, accounts, selectedAccount, connect, selectAccount } = useWallet();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<GateError | null>(null);

  const activeAddress = selectedAccount?.address;

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      await connect();
    } catch {
      setError({
        message: 'Could not reach your Polkadot.js wallet',
        detail: 'Install the Polkadot.js browser extension, then reload this page.',
      });
    }
  }, [connect]);

  const handleSignIn = useCallback(async () => {
    if (!activeAddress) {
      return;
    }

    setPhase('signing');
    setError(null);

    try {
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: activeAddress }),
      });

      const challenge = (await nonceResponse.json()) as { message?: string; error?: string };
      if (!nonceResponse.ok || !challenge.message) {
        setError(describeError(challenge.error ?? '', challenge as Record<string, unknown>));
        setPhase('error');
        return;
      }

      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(activeAddress);
      if (!injector.signer.signRaw) {
        throw new Error('The wallet extension does not support message signing');
      }
      const { signature } = await injector.signer.signRaw({
        address: activeAddress,
        // Hex-encoded so the signed bytes are unambiguously the UTF-8 message,
        // which is what the server reconstructs and verifies.
        data: stringToHex(challenge.message),
        type: 'bytes',
      });

      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: activeAddress, signature }),
      });

      if (verifyResponse.ok) {
        // The gate lives in the root layout, which only re-renders on a full
        // navigation — a soft push would leave the login screen mounted.
        window.location.reload();
        return;
      }

      const failure = (await verifyResponse.json()) as Record<string, unknown>;
      setError(describeError(String(failure.error ?? ''), failure));
      setPhase('error');
    } catch {
      setError({
        message: 'Sign-in was cancelled',
        detail: 'The signature request was rejected or the extension is unavailable.',
      });
      setPhase('error');
    }
  }, [activeAddress]);

  const busy = phase === 'signing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-bluehole-900 via-bluehole-800 to-caribbean-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-caribbean-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-jungle-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-lg shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-caribbean-500 to-bluehole-600 mb-4">
            <ShieldCheck size={40} weight="duotone" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-bluehole-900 mb-2">Blue Hole Portal</h1>
          <p className="text-bluehole-600 mb-6">Government Administration Dashboard</p>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-maya-100 text-maya-800 text-sm">
            <div className="w-2 h-2 rounded-full bg-maya-500 animate-pulse" />
            <span>Secure Access</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bluehole-50 border border-bluehole-200 rounded-lg p-4 text-sm text-bluehole-700">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <LockKey size={16} weight="fill" aria-hidden="true" /> Authorized Personnel Only
            </p>
            <p>
              Sign in with a government-authorized Polkadot.js account. Access requires a verified
              BelizeID at KYC level 2 or above.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
            >
              <p className="font-semibold mb-1">{error.message}</p>
              {error.detail && <p className="text-red-700">{error.detail}</p>}
            </div>
          )}

          {!isConnected ? (
            <button
              type="button"
              onClick={handleConnect}
              className="w-full px-6 py-3 rounded-lg bg-bluehole-900 text-white font-semibold hover:bg-bluehole-800 transition"
            >
              Connect Government Wallet
            </button>
          ) : (
            <>
              {accounts.length > 1 && (
                <div>
                  <label
                    htmlFor="account"
                    className="block text-sm font-medium text-bluehole-800 mb-2"
                  >
                    Select account
                  </label>
                  <select
                    id="account"
                    value={activeAddress ?? ''}
                    onChange={(event) => selectAccount(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-bluehole-200 bg-white text-bluehole-900"
                  >
                    {accounts.map((account) => (
                      <option key={account.address} value={account.address}>
                        {account.meta.name ?? 'Account'} — {account.address.slice(0, 6)}…
                        {account.address.slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {accounts.length === 1 && activeAddress && (
                <p className="text-sm text-bluehole-700">
                  Account:{' '}
                  <span className="font-mono">
                    {activeAddress.slice(0, 6)}…{activeAddress.slice(-6)}
                  </span>
                </p>
              )}

              <button
                type="button"
                onClick={handleSignIn}
                disabled={busy || !activeAddress}
                className="w-full px-6 py-3 rounded-lg bg-bluehole-900 text-white font-semibold hover:bg-bluehole-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Waiting for signature…' : 'Sign in to authenticate'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-bluehole-600">
            Requires the Polkadot.js browser extension
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-bluehole-200">
          <p className="text-xs text-center text-bluehole-500">
            Secured by BelizeChain • Ministry of Digital Transformation
          </p>
        </div>
      </div>
    </div>
  );
}
