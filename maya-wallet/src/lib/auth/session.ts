/**
 * Session tokens for Maya Wallet.
 *
 * Same construction as the Portal's module (HMAC-SHA256 over a JSON payload in
 * an httpOnly cookie, no server-side store), but a deliberately different
 * payload: the wallet proves *control of an account*, and does not require
 * BelizeID KYC. A citizen has to be able to open their own wallet to build an
 * identity in the first place, so gating here on KYC would lock people out of
 * onboarding.
 *
 * Deliberately dependency-free.
 */

import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'bh_wallet_session';
export const NONCE_COOKIE = 'bh_wallet_nonce';

export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const NONCE_TTL_SECONDS = 5 * 60;

export interface Session {
  /** Account address, SS58. */
  a: string;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expires-at, unix seconds. */
  exp: number;
}

export interface NonceChallenge {
  a: string;
  n: string;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * The signing secret, or null when unset.
 *
 * Callers must treat null as "deny": a missing secret accepting sessions would
 * make the gate decorative, so it fails closed.
 */
export function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decoded over an explicit ArrayBuffer so the result satisfies BufferSource;
 * a plain `Uint8Array` is typed against ArrayBufferLike and Web Crypto rejects it.
 */
function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Serialise a payload into `base64url(json).base64url(hmac)`. */
export async function seal(payload: object, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(body)),
  );
  return `${body}.${toBase64Url(signature)}`;
}

/** Verify the tag and decode the payload, or null if anything is wrong. */
export async function open<T>(token: string, secret: string): Promise<T | null> {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) {
    return null;
  }

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      await importKey(secret),
      fromBase64Url(signature),
      encoder.encode(body),
    );
  } catch {
    return null;
  }

  if (!valid) {
    return null;
  }

  try {
    return JSON.parse(decoder.decode(fromBase64Url(body))) as T;
  } catch {
    return null;
  }
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * The exact string the user signs.
 *
 * Kept here rather than in the client so the two cannot drift — a mismatch
 * would make every signature fail to verify.
 */
export function buildSignMessage(address: string, nonce: string, issuedAt: number): string {
  return [
    'Maya Wallet — authentication',
    '',
    `Account: ${address}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date(issuedAt * 1000).toISOString()}`,
    '',
    'Signing proves you control this account. It is not a transaction and costs no fees.',
  ].join('\n');
}

export function createNonceChallenge(address: string): NonceChallenge {
  const issuedAt = nowSeconds();
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return {
    a: address,
    n: toBase64Url(bytes),
    iat: issuedAt,
    exp: issuedAt + NONCE_TTL_SECONDS,
  };
}

export function createSession(address: string): Session {
  const issuedAt = nowSeconds();
  return {
    a: address,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
  };
}

/** Read and verify the session cookie. Returns null when absent or invalid. */
export async function readSession(): Promise<Session | null> {
  const secret = getSessionSecret();
  if (!secret) {
    console.error('[auth] AUTH_SESSION_SECRET is unset or too short — denying all sessions');
    return null;
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await open<Session>(token, secret);
  if (!session || typeof session.exp !== 'number' || session.exp <= nowSeconds()) {
    return null;
  }

  return session;
}
