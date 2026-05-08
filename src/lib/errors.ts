import { z } from "zod";
import type { FirebaseError } from "firebase/app";

export function formatAppError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Validation failed.";
  }

  const fbError = error as Partial<FirebaseError> | undefined;
  if (fbError?.code === "invalid-credential" || fbError?.code === "auth/invalid-credential") {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (fbError?.code === "wrong-password" || fbError?.code === "auth/wrong-password") {
    return "Incorrect password. Try again or contact administrator.";
  }
  if (fbError?.code === "user-not-found" || fbError?.code === "auth/user-not-found") {
    return "No account found for this email.";
  }
  if (fbError?.code === "email-already-in-use" || fbError?.code === "auth/email-already-in-use") {
    return "This email is already registered. Try signing in instead.";
  }
  if (fbError?.code === "weak-password" || fbError?.code === "auth/weak-password") {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (fbError?.code === "invalid-email" || fbError?.code === "auth/invalid-email") {
    return "Invalid email format.";
  }
  if (fbError?.code === "permission-denied") {
    return "Missing permissions. Sign out and sign in again. If it still fails, verify Firestore rules for your user path.";
  }
  if (fbError?.code === "unauthenticated") {
    return "You must be logged in to perform this action.";
  }
  if (fbError?.code === "unavailable") {
    return "Service temporarily unavailable. Try again in a moment.";
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
