/**
 * Step 2 of login: verify the signed challenge and, if the account holds
 * sufficient BelizeID KYC, issue a session.
 *
 * The order matters: the signature is checked first, so an unauthenticated
 * caller cannot use this endpoint to probe anyone's KYC level.
 */

import { NextRequest, NextResponse } from 'next/server';
import { signatureVerify } from '@polkadot/util-crypto';
import { lookupKycLevel } from '@/lib/auth/chain';
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

/** Minimum BelizeID level for Portal access. Configurable so it can be raised without a rebuild. */
const REQUIRED_KYC_LEVEL = Number.parseInt(process.env.AUTH_REQUIRED_KYC_LEVEL ?? '2', 10);

/**
 * Log a rejected sign-in and build its response.
 *
 * Every rejection is logged on purpose. Without this the route answered with a
 * bare status code and left nothing in the container log, so a failed sign-in
 * was indistinguishable from a successful one when read from the access log —
 * the reason had to be recovered by rebuilding and replaying the flow by hand.
 *
 * `context` goes to the log only, so the response body keeps exactly the shape
 * it had before; `body` is for the rare rejection that carries more than an
 * error code to the client.
 */
function reject(
  reason: string,
  status: number,
  context: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
) {
  console.warn('[auth] verify rejected:', reason, { status, ...context });
  return NextResponse.json({ error: reason, ...body }, { status });
}

export async function POST(request: NextRequest) {
  const secret = getSessionSecret();
  if (!secret) {
    return reject('auth_not_configured', 503);
  }

  const body = (await request.json().catch(() => null)) as
    | { address?: unknown; signature?: unknown }
    | null;

  const address = body?.address;
  const signature = body?.signature;

  if (typeof address !== 'string' || typeof signature !== 'string' || !address || !signature) {
    return reject('address_and_signature_required', 400);
  }

  const challengeToken = request.cookies.get(NONCE_COOKIE)?.value;
  if (!challengeToken) {
    return reject('no_active_challenge', 400, { address });
  }

  const challenge = await open<NonceChallenge>(challengeToken, secret);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!challenge || challenge.exp <= nowSeconds) {
    return reject('challenge_expired', 400, { address });
  }

  // The challenge is bound to one address; signing it with another must not pass.
  if (challenge.a !== address) {
    return reject('address_mismatch', 400, { address, challenge: challenge.a });
  }

  const message = buildSignMessage(address, challenge.n, challenge.iat);

  let signatureValid: boolean;
  try {
    signatureValid = signatureVerify(message, signature, address).isValid;
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return reject('invalid_signature', 401, { address });
  }

  const { level, degraded } = await lookupKycLevel(address);

  if (degraded) {
    // Unknown is not the same as unauthorized — refuse rather than let an
    // unreachable node look like an unverified account.
    return reject('kyc_lookup_unavailable', 503, { address });
  }

  if (level < REQUIRED_KYC_LEVEL) {
    return reject('insufficient_kyc', 403, { address, level }, { level, required: REQUIRED_KYC_LEVEL });
  }

  console.info('[auth] verify ok:', address, { kycLevel: level });

  const response = NextResponse.json({ ok: true, address, kycLevel: level });

  response.cookies.set(SESSION_COOKIE, await seal(createSession(address, level), secret), {
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
