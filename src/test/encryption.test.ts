/**
 * Unit tests for src/lib/encryption.ts
 *
 * Runs in the jsdom environment (vitest) which provides the Web Crypto API.
 */

import { describe, expect, it } from "vitest";
import {
  decryptField,
  decryptNumber,
  deriveKey,
  encryptField,
  encryptNumber,
  generateSalt,
  isEncryptedBlob,
} from "@/lib/encryption";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a test key from a fixed password + salt. */
async function makeKey(password = "testPassword123!", salt?: string) {
  const s = salt ?? generateSalt();
  const key = await deriveKey(password, s);
  return { key, salt: s };
}

// ---------------------------------------------------------------------------
// generateSalt
// ---------------------------------------------------------------------------

describe("generateSalt", () => {
  it("returns a non-empty base64 string", () => {
    const salt = generateSalt();
    expect(typeof salt).toBe("string");
    expect(salt.length).toBeGreaterThan(0);
  });

  it("returns a different value on each call", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// deriveKey
// ---------------------------------------------------------------------------

describe("deriveKey", () => {
  it("returns a CryptoKey with the correct algorithm", async () => {
    const { key } = await makeKey();
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm.name).toBe("AES-GCM");
    expect(key.extractable).toBe(false);
  });

  it("derives the same key given the same password + salt", async () => {
    // We can't directly compare CryptoKey objects, so we verify they
    // produce the same ciphertext structure via encrypt round-trip.
    const salt = generateSalt();
    const { key: keyA } = await makeKey("samePass", salt);
    const { key: keyB } = await makeKey("samePass", salt);

    const cipher = await encryptField("hello", keyA);
    const plain = await decryptField(cipher, keyB);
    expect(plain).toBe("hello");
  });

  it("derives different keys for different passwords", async () => {
    const salt = generateSalt();
    const { key: keyA } = await makeKey("passwordA", salt);
    const { key: keyB } = await makeKey("passwordB", salt);

    const cipher = await encryptField("secret", keyA);
    const result = await decryptField(cipher, keyB);
    // Wrong key → decryption fails → null
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// encryptField / decryptField
// ---------------------------------------------------------------------------

describe("encryptField / decryptField", () => {
  it("round-trips a plain string", async () => {
    const { key } = await makeKey();
    const cipher = await encryptField("Hello, World!", key);
    const plain = await decryptField(cipher, key);
    expect(plain).toBe("Hello, World!");
  });

  it("round-trips an empty string", async () => {
    const { key } = await makeKey();
    const cipher = await encryptField("", key);
    const plain = await decryptField(cipher, key);
    expect(plain).toBe("");
  });

  it("round-trips a string with unicode characters", async () => {
    const { key } = await makeKey();
    const value = "Pojazd: żółw 🐢 — numer rejestracyjny WA 12345";
    const cipher = await encryptField(value, key);
    const plain = await decryptField(cipher, key);
    expect(plain).toBe(value);
  });

  it("produces a different ciphertext on every call (fresh IV)", async () => {
    const { key } = await makeKey();
    const a = await encryptField("same", key);
    const b = await encryptField("same", key);
    expect(a).not.toBe(b);
  });

  it("returns null when decrypting with the wrong key", async () => {
    const { key: keyA } = await makeKey("passA");
    const { key: keyB } = await makeKey("passB");
    const cipher = await encryptField("secret", keyA);
    const result = await decryptField(cipher, keyB);
    expect(result).toBeNull();
  });

  it("returns null for a corrupted ciphertext", async () => {
    const { key } = await makeKey();
    const result = await decryptField("bm90YXZhbGlkY2lwaGVydGV4dA==", key);
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const { key } = await makeKey();
    const result = await decryptField("", key);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// encryptNumber / decryptNumber
// ---------------------------------------------------------------------------

describe("encryptNumber / decryptNumber", () => {
  it("round-trips an integer", async () => {
    const { key } = await makeKey();
    const cipher = await encryptNumber(42, key);
    const value = await decryptNumber(cipher, key);
    expect(value).toBe(42);
  });

  it("round-trips a float", async () => {
    const { key } = await makeKey();
    const cipher = await encryptNumber(3.14159, key);
    const value = await decryptNumber(cipher, key);
    expect(value).toBeCloseTo(3.14159);
  });

  it("round-trips zero", async () => {
    const { key } = await makeKey();
    const cipher = await encryptNumber(0, key);
    const value = await decryptNumber(cipher, key);
    expect(value).toBe(0);
  });

  it("round-trips a large mileage value", async () => {
    const { key } = await makeKey();
    const mileage = 1_234_567;
    const cipher = await encryptNumber(mileage, key);
    const value = await decryptNumber(cipher, key);
    expect(value).toBe(mileage);
  });

  it("returns null when decrypting with the wrong key", async () => {
    const { key: kA } = await makeKey("passA");
    const { key: kB } = await makeKey("passB");
    const cipher = await encryptNumber(999, kA);
    const result = await decryptNumber(cipher, kB);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isEncryptedBlob
// ---------------------------------------------------------------------------

describe("isEncryptedBlob", () => {
  it("returns true for a real encrypted blob", async () => {
    const { key } = await makeKey();
    const cipher = await encryptField("data", key);
    expect(isEncryptedBlob(cipher)).toBe(true);
  });

  it("returns false for a plain string", () => {
    expect(isEncryptedBlob("WA 12345")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isEncryptedBlob(12345)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isEncryptedBlob(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isEncryptedBlob(undefined)).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isEncryptedBlob("")).toBe(false);
  });
});
