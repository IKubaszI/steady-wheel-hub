import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:demo",
};

export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

let appPromise: Promise<FirebaseApp> | null = null;
function ensureApp() {
  if (!appPromise) {
    appPromise = import("firebase/app").then(({ initializeApp }) => initializeApp(firebaseConfig));
  }
  return appPromise;
}

let authInstance: Auth | null = null;
export async function getFirebaseAuth() {
  const authMod = await import("firebase/auth");
  if (!authInstance) {
    const app = await ensureApp();
    authInstance = authMod.getAuth(app);
  }
  return {
    auth: authInstance,
    authMod,
  };
}

let dbInstance: Firestore | null = null;
export async function getFirebaseDb() {
  const dbMod = await import("firebase/firestore");
  if (!dbInstance) {
    const app = await ensureApp();
    dbInstance = dbMod.initializeFirestore(app, {
      localCache: dbMod.persistentLocalCache({
        tabManager: dbMod.persistentMultipleTabManager(),
      }),
    });
  }
  return {
    db: dbInstance,
    dbMod,
  };
}
