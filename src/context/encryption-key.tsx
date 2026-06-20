/**
 * EncryptionKeyContext
 *
 * Holds the in-memory AES-GCM CryptoKey for the current session.
 * The key is derived from the user's password via PBKDF2 and is
 * NEVER persisted to disk — only to sessionStorage as a raw password
 * so the key can be re-derived after a page reload.
 *
 * Provider hierarchy requirement:
 *   <AuthProvider>
 *     <EncryptionKeyProvider>   ← this context
 *       <GarageDataProvider>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { deriveKey, generateSalt } from "@/lib/encryption";
import { useAuth } from "@/context/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EncryptionKeyValue = {
  /** The in-memory AES key. null when locked. */
  cryptoKey: CryptoKey | null;
  /** True once a valid key has been derived. */
  isUnlocked: boolean;
  /**
   * Derive + store the key from the user's password.
   * Also fetches (or creates) the per-user salt from Firestore.
   */
  unlock: (password: string) => Promise<void>;
  /** Wipe the key from memory and sessionStorage. */
  lock: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_PWD_KEY = "steadywheelhub.encPwd";
const DEMO_SALT = "demoSaltBase64demoSaltBase64=="; // fixed demo salt

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EncryptionKeyContext = createContext<EncryptionKeyValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EncryptionKeyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Use a ref to avoid re-renders on key change; expose via state too for consumers.
  const keyRef = useRef<CryptoKey | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // ------------------------------------------------------------------
  // Helpers: salt management
  // ------------------------------------------------------------------

  const fetchOrCreateSalt = useCallback(
    async (uid: string): Promise<string> => {
      if (!isFirebaseConfigured) return DEMO_SALT;

      const settingsRef = doc(db, "users", uid, "meta", "encryption");
      const snap = await getDoc(settingsRef);

      if (snap.exists() && typeof snap.data()?.salt === "string") {
        return snap.data().salt as string;
      }

      // First login for this user — generate and store the salt.
      const salt = generateSalt();
      await setDoc(settingsRef, { salt }, { merge: true });
      return salt;
    },
    [],
  );

  // ------------------------------------------------------------------
  // unlock
  // ------------------------------------------------------------------

  const unlock = useCallback(
    async (password: string) => {
      if (!user) return;

      const salt = await fetchOrCreateSalt(user.uid);
      const key = await deriveKey(password, salt);

      keyRef.current = key;
      setIsUnlocked(true);

      // Persist raw password so we can re-derive the key after a page reload.
      // sessionStorage is cleared when the tab is closed — acceptable trade-off.
      window.sessionStorage.setItem(SESSION_PWD_KEY, password);
    },
    [user, fetchOrCreateSalt],
  );

  // ------------------------------------------------------------------
  // lock
  // ------------------------------------------------------------------

  const lock = useCallback(() => {
    keyRef.current = null;
    setIsUnlocked(false);
    window.sessionStorage.removeItem(SESSION_PWD_KEY);
  }, []);

  // ------------------------------------------------------------------
  // Auto-unlock on mount when a cached password exists in sessionStorage
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!user || isUnlocked) return;

    const cached = window.sessionStorage.getItem(SESSION_PWD_KEY);
    if (!cached) return;

    unlock(cached).catch(() => {
      // Corrupted session — wipe it.
      window.sessionStorage.removeItem(SESSION_PWD_KEY);
    });
  }, [user, isUnlocked, unlock]);

  // ------------------------------------------------------------------
  // Clear key on logout
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!user && isUnlocked) {
      lock();
    }
  }, [user, isUnlocked, lock]);

  // ------------------------------------------------------------------
  // Value
  // ------------------------------------------------------------------

  const value = useMemo<EncryptionKeyValue>(
    () => ({
      cryptoKey: keyRef.current,
      isUnlocked,
      unlock,
      lock,
    }),
    [isUnlocked, unlock, lock],
  );

  return (
    <EncryptionKeyContext.Provider value={value}>
      {children}
    </EncryptionKeyContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEncryptionKey(): EncryptionKeyValue {
  const ctx = useContext(EncryptionKeyContext);
  if (!ctx) {
    throw new Error("useEncryptionKey must be used within EncryptionKeyProvider");
  }
  return ctx;
}
