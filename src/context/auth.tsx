import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userDisplayNameSchema } from "@/lib/schemas";

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      // #region agent log
      fetch("http://127.0.0.1:7473/ingest/c92d45c3-2486-4971-bdda-49f6ef1dcc6d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "96ff81" },
        body: JSON.stringify({
          sessionId: "96ff81",
          runId: "auth-debug-1",
          hypothesisId: "H1",
          location: "src/context/auth.tsx:onAuthStateChanged",
          message: "Auth state changed",
          data: {
            hasUser: Boolean(nextUser),
            uidPresent: Boolean(nextUser?.uid),
            emailVerified: nextUser?.emailVerified ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      register: async (name, email, password) => {
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        const parsedName = userDisplayNameSchema.safeParse(name);
        if (!parsedName.success) {
          throw parsedName.error;
        }
        await updateProfile(creds.user, { displayName: parsedName.data });
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        await signOut(auth);
      },
      updateUserProfile: async ({ displayName, photoURL }) => {
        if (!auth.currentUser) {
          throw new Error("You must be logged in to update profile.");
        }
        let validatedDisplayName = displayName;
        if (typeof displayName === "string") {
          const parsedName = userDisplayNameSchema.safeParse(displayName);
          if (!parsedName.success) {
            throw parsedName.error;
          }
          validatedDisplayName = parsedName.data;
        }
        await updateProfile(auth.currentUser, { displayName: validatedDisplayName, photoURL });
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
