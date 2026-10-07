/** Clear the session. Local only — nothing server-side needs invalidating. */

import { NextResponse } from 'next/server';
import { NONCE_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(NONCE_COOKIE);
  return response;
}
