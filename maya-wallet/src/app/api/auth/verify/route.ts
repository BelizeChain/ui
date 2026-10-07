/**
 * Step 2 of wallet sign-in: verify the signed challenge and issue a session.
 *
 * No KYC check here by design — the wallet gates on key control only, so that a
 * citizen who has not yet completed BelizeID can still open their wallet and
 * begin verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { signatureVerify } from '@polkadot/util-crypto';
import {
  NONCE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  buildSignMessage,
  createSession,
  getSessionSecret,
  open,
  seal,
  type NonceChallenge,
} from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | { address?: unknown; signature?: unknown }
    | null;

  const address = body?.address;
  const signature = body?.signature;

  if (typeof address !== 'string' || typeof signature !== 'string' || !address || !signature) {
    return NextResponse.json({ error: 'address_and_signature_required' }, { status: 400 });
  }

  const challengeToken = request.cookies.get(NONCE_COOKIE)?.value;
  if (!challengeToken) {
    return NextResponse.json({ error: 'no_active_challenge' }, { status: 400 });
  }

  const challenge = await open<NonceChallenge>(challengeToken, secret);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!challenge || challenge.exp <= nowSeconds) {
    return NextResponse.json({ error: 'challenge_expired' }, { status: 400 });
  }

  // The challenge is bound to one address; signing it with another must not pass.
  if (challenge.a !== address) {
    return NextResponse.json({ error: 'address_mismatch' }, { status: 400 });
  }

  const message = buildSignMessage(address, challenge.n, challenge.iat);

  let signatureValid: boolean;
  try {
    signatureValid = signatureVerify(message, signature, address).isValid;
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, address });

  response.cookies.set(SESSION_COOKIE, await seal(createSession(address), secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  // Single-use: the challenge cannot be replayed against another signature.
  response.cookies.delete(NONCE_COOKIE);

  return response;
}
