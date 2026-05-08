import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { userDisplayNameSchema } from "@/lib/schemas";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const parsedName = userDisplayNameSchema.safeParse(name);
        if (!parsedName.success) {
          throw parsedName.error;
        }
        await register(parsedName.data, email.trim(), password);
        sessionStorage.setItem("steadywheelhub.onboarding", "1");
        toast({
          title: "Account created",
          description: "Welcome! Next step: add your first car in Vehicles.",
        });
      } else {
        await login(email.trim(), password);
        toast({ title: "Logged in", description: "You are now signed in." });
      }
    } catch (error) {
      const message = formatAppError(error, "Authentication failed.");
      toast({
        title: "Auth error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = () => {
    toast({
      title: "Password support",
      description: "Contact application administrator: kubasz2231@gmail.com",
    });
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to access your vehicles and invoices."
              : "Register to start storing your data in Firebase."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" maxLength={254} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
              >
                {mode === "login" ? "Create account" : "I already have an account"}
              </button>
              {mode === "login" && (
                <button type="button" className="text-muted-foreground underline" onClick={onResetPassword}>
                  Forgot password?
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
