'use client';

/**
 * Sign-in gate for Maya Wallet.
 *
 * Requires proof of control over a Polkadot.js account: sign a one-time
 * challenge, verified server-side. Deliberately not KYC-gated — a citizen must
 * be able to open their wallet in order to complete BelizeID verification.
 */

import { useCallback, useState } from 'react';
import { useWallet } from '@belizechain/shared';
import { stringToHex } from '@polkadot/util';

type Phase = 'idle' | 'signing' | 'error';

interface GateError {
  message: string;
  detail?: string;
}

function describeError(code: string): GateError {
  switch (code) {
    case 'invalid_signature':
      return { message: 'Signature did not match', detail: 'Please try again.' };
    case 'no_active_challenge':
    case 'challenge_expired':
      return { message: 'The request timed out', detail: 'Please try again.' };
    case 'auth_not_configured':
      return {
        message: 'Sign-in is not configured',
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
        setError(describeError(challenge.error ?? ''));
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
        // Hex-encoded so the signed bytes are unambiguously the UTF-8 message
        // the server reconstructs.
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
        // navigation.
        window.location.reload();
        return;
      }

      const failure = (await verifyResponse.json()) as { error?: string };
      setError(describeError(String(failure.error ?? '')));
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 mb-4">
            <span className="text-3xl" role="img" aria-label="Maya Wallet">
              👛
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Maya Wallet</h1>
          <p className="text-slate-600">Your Belizean digital wallet</p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
            <p className="font-semibold mb-1">Sign in to continue</p>
            <p>
              Unlock with your Polkadot.js account. Signing proves you own this account — it is not
              a transaction and costs no fees.
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
              className="w-full px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <>
              {accounts.length > 1 && (
                <div>
                  <label
                    htmlFor="account"
                    className="block text-sm font-medium text-slate-800 mb-2"
                  >
                    Select account
                  </label>
                  <select
                    id="account"
                    value={activeAddress ?? ''}
                    onChange={(event) => selectAccount(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
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
                <p className="text-sm text-slate-700">
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
                className="w-full px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Waiting for signature…' : 'Unlock Maya Wallet'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-slate-500">
            Requires the Polkadot.js browser extension
          </p>
        </div>
      </div>
    </div>
  );
}
