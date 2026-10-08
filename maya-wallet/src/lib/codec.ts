/**
 * Decode a `BoundedVec<u8, _>` (Substrate `Bytes`) into a UTF-8 string.
 *
 * Returns the original bytes as hex if decoding produces non-printable
 * characters, so callers always get something displayable rather than mojibake.
 */
export function bytesToString(raw: unknown): string {
  if (raw == null) return '';
  const codec = raw as { toU8a?: () => Uint8Array; toString?: () => string };
  let bytes: Uint8Array | null = null;
  try {
    if (typeof codec.toU8a === 'function') {
      bytes = codec.toU8a();
    }
  } catch {
    bytes = null;
  }
  if (!bytes || bytes.length === 0) {
    return typeof codec.toString === 'function' ? codec.toString() : '';
  }
  const toHex = () =>
    `0x${Array.from(bytes as Uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // If decode produced any unprintable bytes (other than common whitespace), fall back to hex.
    if (/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/.test(decoded)) {
      return toHex();
    }
    return decoded;
  } catch {
    return toHex();
  }
}
