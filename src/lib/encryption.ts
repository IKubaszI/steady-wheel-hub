/**
 * E2EE Encryption Module — steady-wheel-hub
 *
 * Uses the native Web Crypto API (zero dependencies):
 *   - PBKDF2  (SHA-256, 100 000 iterations) to derive a 256-bit AES key from the user's password
 *   - AES-GCM (256-bit)                    for authenticated encryption of individual fields
 *
 * Wire format for an encrypted field (Base64-encoded):
 *   [ salt (16 B) | iv (12 B) | ciphertext (variable) ]
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function concatBuffers(...parts: ArrayBuffer[]): ArrayBuffer {
  const total = parts.reduce((sum, b) => sum + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return out.buffer;
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------------------------------------------------------------------------
// Salt generation (one per user, stored as Base64 in Firestore)
// ---------------------------------------------------------------------------

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)).buffer);
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derives an AES-GCM CryptoKey from the user's plaintext password and their
 * per-account Base64-encoded salt.
 *
 * The result must be kept in memory only — never serialised or stored.
 */
export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltBase64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,            // non-extractable
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Field-level encrypt / decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypts a UTF-8 string field and returns a Base64 blob:
 *   salt (16 B) + iv (12 B) + ciphertext
 *
 * A fresh random IV is generated for every call.
 */
export async function encryptField(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const enc = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );

  return toBase64(concatBuffers(iv.buffer, ciphertext));
}

/**
 * Decrypts a Base64 blob produced by `encryptField`.
 * Returns null when decryption fails (wrong key / corrupted data).
 */
export async function decryptField(cipherBase64: string, key: CryptoKey): Promise<string | null> {
  try {
    const buf = fromBase64(cipherBase64);
    const iv = buf.subarray(0, IV_BYTES);
    const ciphertext = buf.subarray(IV_BYTES);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers for typed values
// ---------------------------------------------------------------------------

export async function encryptNumber(value: number, key: CryptoKey): Promise<string> {
  return encryptField(String(value), key);
}

export async function decryptNumber(cipherBase64: string, key: CryptoKey): Promise<number | null> {
  const raw = await decryptField(cipherBase64, key);
  if (raw === null) return null;
  const n = Number(raw);
  return isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Sentinel: detect whether a stored field is already encrypted
// ---------------------------------------------------------------------------

/**
 * Returns true when the value looks like an encrypted blob.
 * Encrypted blobs are always Base64 strings; plain values are not.
 */
export function isEncryptedBlob(value: unknown): value is string {
  if (typeof value !== "string" || value.length < IV_BYTES * 2) return false;
  // Fast heuristic: valid Base64 with no spaces and length divisible by 4
  return /^[A-Za-z0-9+/]+=*$/.test(value) && value.length % 4 === 0;
}
