/**
 * Step 1 of login: hand the client a challenge to sign.
 *
 * The challenge is returned in a signed, httpOnly cookie rather than kept in
 * server memory, so it survives a restart and needs no shared store. It is
 * cleared by the verify route the moment it is used.
 */

import { NextResponse } from 'next/server';
import {
  NONCE_COOKIE,
  NONCE_TTL_SECONDS,
  buildSignMessage,
  createNonceChallenge,
  getSessionSecret,
  seal,
} from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { address?: unknown } | null;
  const address = body?.address;

  if (typeof address !== 'string' || address.length === 0) {
    return NextResponse.json({ error: 'address_required' }, { status: 400 });
  }

  const challenge = createNonceChallenge(address);
  const response = NextResponse.json({
    // Sent so the exact signed text is visible in the extension prompt.
    message: buildSignMessage(address, challenge.n, challenge.iat),
  });

  response.cookies.set(NONCE_COOKIE, await seal(challenge, secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: NONCE_TTL_SECONDS,
  });

  return response;
}
