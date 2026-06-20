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
import { DEMO_USER, seedDemoDataIfEmpty } from "@/lib/demo";
import { auth } from "@/lib/firebase";
import { AccessibilityWidget } from "@/components/layout/AccessibilityWidget";
import { useSettings } from "@/context/settings";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useSettings();

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
          title: t("auth.toast.created"),
          description: t("auth.toast.onboarding"),
        });
      } else {
        await login(email.trim(), password);
        toast({ title: t("auth.toast.loggedIn"), description: t("auth.toast.loggedInDesc") });
      }
    } catch (error) {
      const message = formatAppError(error, "Authentication failed.");
      toast({
        title: t("vehicles.toast.saveFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = () => {
    toast({
      title: t("auth.supportTitle"),
      description: t("auth.supportDesc"),
    });
  };

  const onDemoLogin = async () => {
    setBusy(true);
    try {
      try {
        await login(DEMO_USER.email, DEMO_USER.password);
      } catch {
        await register(DEMO_USER.name, DEMO_USER.email, DEMO_USER.password);
      }

      const uid = auth.currentUser?.uid;
      if (uid) {
        const seeded = await seedDemoDataIfEmpty(uid);
        toast({
          title: t("auth.toast.demo"),
          description: seeded
            ? t("auth.toast.demoSeeded")
            : t("auth.toast.demo"),
        });
      } else {
        toast({ title: t("auth.toast.demo"), description: t("auth.toast.demo") });
      }
    } catch (error) {
      toast({
        title: t("auth.toast.demoFailed"),
        description: formatAppError(error, "Could not start demo mode."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? t("auth.signIn") : t("auth.createAccount")}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? t("auth.signInDesc")
              : t("auth.registerDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" maxLength={254} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? t("auth.pleaseWait") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
            </Button>
            {mode === "login" && (
              <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={onDemoLogin}>
                {busy ? t("auth.pleaseWait") : t("auth.tryDemo")}
              </Button>
            )}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
              >
                {mode === "login" ? t("auth.createAccount") : t("auth.alreadyHaveAccount")}
              </button>
              {mode === "login" && (
                <button type="button" className="text-muted-foreground underline" onClick={onResetPassword}>
                  {t("auth.forgotPassword")}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <AccessibilityWidget hasSidebar={false} />
    </div>
  );
}
