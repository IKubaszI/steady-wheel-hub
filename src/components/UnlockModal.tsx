/**
 * UnlockModal
 *
 * Displayed when the user is authenticated with Firebase but the in-memory
 * encryption key has been lost (e.g. page reload without a cached session
 * password, or sessionStorage was cleared manually).
 *
 * The user re-enters their account password to re-derive the AES key.
 */

import { useState, type FormEvent } from "react";
import { KeyRound, Lock } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useEncryptionKey } from "@/context/encryption-key";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UnlockModal() {
  const { user, logout } = useAuth();
  const { isUnlocked, unlock } = useEncryptionKey();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only render when the user is logged in but the key is missing.
  if (!user || isUnlocked) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      await unlock(password);
    } catch {
      setError("Incorrect password or failed to unlock data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-screen overlay — sits on top of everything */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="surface-card w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl border border-border">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h2
          id="unlock-modal-title"
          className="text-center font-display text-2xl font-bold mb-2"
        >
          Unlock your data
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Your session has expired. Enter your account password to decrypt your
          garage data.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <Input
              id="unlock-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            id="unlock-submit-btn"
            type="submit"
            className="w-full gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            disabled={loading || !password}
          >
            <KeyRound className="h-4 w-4" />
            {loading ? "Unlocking…" : "Unlock"}
          </Button>
        </form>

        {/* Escape hatch */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Sign out and start fresh
          </button>
        </div>
      </div>
    </div>
  );
}
