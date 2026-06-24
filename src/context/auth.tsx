import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { userDisplayNameSchema } from "@/lib/schemas";

type AppUser = Pick<User, "uid" | "email" | "displayName" | "photoURL" | "getIdToken">;

type AuthValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);
const DEMO_SESSION_KEY = "steadywheelhub.demoUser";

function createDemoUser(email: string, displayName = "Demo Driver", photoURL: string | null = null): AppUser {
  return {
    uid: "demo-user",
    email,
    displayName,
    photoURL,
    getIdToken: async () => "demo-token",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(() => isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const stored = window.sessionStorage.getItem(DEMO_SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { email?: string; displayName?: string; photoURL?: string | null };
          setUser(createDemoUser(parsed.email || "demo@garageos.local", parsed.displayName || "Demo Driver", parsed.photoURL ?? null));
        } catch {
          window.sessionStorage.removeItem(DEMO_SESSION_KEY);
        }
      }
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    getFirebaseAuth().then(({ auth, authMod }) => {
      unsub = authMod.onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    }).catch(err => {
      console.error("Failed to load Firebase auth on initialization:", err);
      setLoading(false);
    });

    return () => unsub?.();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        if (!isFirebaseConfigured) {
          if (!email.trim() || password.length < 6) {
            throw new Error("Enter an email and a password with at least 6 characters.");
          }
          const demoUser = createDemoUser(email.trim(), email.trim().split("@")[0] || "Demo Driver");
          window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
          setUser(demoUser);
          return;
        }
        const { auth, authMod } = await getFirebaseAuth();
        await authMod.signInWithEmailAndPassword(auth, email, password);
      },
      register: async (name, email, password) => {
        const parsedName = userDisplayNameSchema.safeParse(name);
        if (!parsedName.success) {
          throw parsedName.error;
        }
        if (!isFirebaseConfigured) {
          if (!email.trim() || password.length < 6) {
            throw new Error("Enter an email and a password with at least 6 characters.");
          }
          const demoUser = createDemoUser(email.trim(), parsedName.data);
          window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
          setUser(demoUser);
          return;
        }
        const { auth, authMod } = await getFirebaseAuth();
        const creds = await authMod.createUserWithEmailAndPassword(auth, email, password);
        await authMod.updateProfile(creds.user, { displayName: parsedName.data });
      },
      resetPassword: async (email) => {
        if (!isFirebaseConfigured) {
          throw new Error("Password reset is available after Firebase is configured.");
        }
        const { auth, authMod } = await getFirebaseAuth();
        await authMod.sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        if (!isFirebaseConfigured) {
          window.sessionStorage.removeItem(DEMO_SESSION_KEY);
          setUser(null);
          return;
        }
        const { auth, authMod } = await getFirebaseAuth();
        await authMod.signOut(auth);
      },
      updateUserProfile: async ({ displayName, photoURL }) => {
        if (!isFirebaseConfigured) {
          const nextUser = createDemoUser(user?.email ?? "demo@garageos.local", displayName ?? user?.displayName ?? "Demo Driver", photoURL ?? user?.photoURL ?? null);
          window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(nextUser));
          setUser(nextUser);
          return;
        }
        const { auth, authMod } = await getFirebaseAuth();
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
        await authMod.updateProfile(auth.currentUser, { displayName: validatedDisplayName, photoURL });
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
