import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, type Currency, type PrimaryColor, type FontScale, type Language, type DistanceUnit } from "@/context/settings";
import { useAuth } from "@/context/auth";
import { uploadImage } from "@/services/cloudinaryService";
import { formatAppError } from "@/lib/errors";
import { userDisplayNameSchema } from "@/lib/schemas";

export function AccountSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const {
    currency, setCurrency, primaryColor, setPrimaryColor, format: fmtMoney,
    language, setLanguage, distanceUnit, setDistanceUnit, t,
    highContrast, setHighContrast,
    reduceMotion, setReduceMotion,
    fontScale, setFontScale,
    dyslexiaFont, setDyslexiaFont,
    underlineLinks, setUnderlineLinks,
  } = useSettings();
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user?.displayName ?? "");
  const [email] = useState(user?.email ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notifyOverdue, setNotifyOverdue] = useState(() => {
    try {
      const stored = localStorage.getItem("garageos.notifications.overdue");
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const [notifyUpcoming, setNotifyUpcoming] = useState(() => {
    try {
      const stored = localStorage.getItem("garageos.notifications.upcoming");
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const [notifyEmail, setNotifyEmail] = useState(() => {
    try {
      const stored = localStorage.getItem("garageos.notifications.email");
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [notifyEmailMonthly, setNotifyEmailMonthly] = useState(() => {
    try {
      const stored = localStorage.getItem("garageos.notifications.emailMonthly");
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const save = async () => {
    try {
      setSaving(true);
      const parsedName = userDisplayNameSchema.safeParse(name);
      if (!parsedName.success) {
        throw parsedName.error;
      }
      await updateUserProfile({ displayName: parsedName.data, photoURL: photoUrl || undefined });
      
      try {
        localStorage.setItem("garageos.notifications.overdue", JSON.stringify(notifyOverdue));
        localStorage.setItem("garageos.notifications.upcoming", JSON.stringify(notifyUpcoming));
        localStorage.setItem("garageos.notifications.email", JSON.stringify(notifyEmail));
        localStorage.setItem("garageos.notifications.emailMonthly", JSON.stringify(notifyEmailMonthly));
      } catch (e) {
        console.error("Failed to save notification preferences", e);
      }

      toast({ title: t("auth.toast.loggedIn"), description: t("settings.accountSettingsDesc") });
      onOpenChange(false);
    } catch (error) {
      toast({ title: t("auth.toast.demoFailed"), description: formatAppError(error, t("validate.brandDesc")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: t("validate.fileTooLarge"), description: t("validate.fileTooLargeDesc"), variant: "destructive" });
      return;
    }
    try {
      setUploadingPhoto(true);
      const uploaded = await uploadImage(file);
      setPhotoUrl(uploaded.secureUrl);
      toast({ title: t("ocr.scanComplete"), description: t("common.saveChanges") });
    } catch (error) {
      toast({ title: t("ocr.scanFailed"), description: formatAppError(error, t("ocr.scanFailedDesc")), variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("settings.accountSettingsTitle")}</DialogTitle>
          <DialogDescription>{t("settings.accountSettingsDesc")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-muted p-1">
            <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
            <TabsTrigger value="prefs">{t("settings.preferences")}</TabsTrigger>
            <TabsTrigger value="notify">{t("settings.notifications")}</TabsTrigger>
            <TabsTrigger value="a11y">{t("settings.accessibility")}</TabsTrigger>
          </TabsList>

          <div className="h-[320px] sm:h-[385px] overflow-y-auto pr-1 mt-4">
            <TabsContent value="profile" className="space-y-4 mt-0 pt-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-background shadow-elev-sm">
                  {photoUrl ? <AvatarImage src={photoUrl} alt={name || "Profile photo"} /> : null}
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                    {name.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? t("common.loading") : t("settings.changePhoto")}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-name">{t("settings.fullName")}</Label>
                <Input id="acc-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-email">{t("settings.email")}</Label>
                <Input id="acc-email" maxLength={254} type="email" value={email} readOnly disabled />
                <p className="text-xs text-muted-foreground">{t("settings.emailWarning")}</p>
              </div>
            </TabsContent>

            <TabsContent value="prefs" className="space-y-4 mt-0 pt-0">
              <div className="space-y-2">
                <Label>{t("settings.distanceUnits")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={distanceUnit === "mi" ? "default" : "outline"} onClick={() => setDistanceUnit("mi")}>{t("settings.imperial")}</Button>
                  <Button variant={distanceUnit === "km" ? "default" : "outline"} onClick={() => setDistanceUnit("km")}>{t("settings.metric")}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.currency")}</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                      <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                      <SelectItem value="PLN">PLN — Polish Zloty (zł)</SelectItem>
                      <SelectItem value="JPY">JPY — Japanese Yen (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("settings.currencyPreview", { val: fmtMoney(1234.5) })}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.language")}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">{t("settings.languagePL")}</SelectItem>
                      <SelectItem value="en">{t("settings.languageEN")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.primaryColor")}</Label>
                <Select value={primaryColor} onValueChange={(v) => setPrimaryColor(v as PrimaryColor)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ocean">{t("color.ocean")}</SelectItem>
                    <SelectItem value="violet">{t("color.violet")}</SelectItem>
                    <SelectItem value="emerald">{t("color.emerald")}</SelectItem>
                    <SelectItem value="rose">{t("color.rose")}</SelectItem>
                    <SelectItem value="amber">{t("color.amber")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("settings.colorDesc")}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label>{t("settings.tutorial") || "Tutorial"}</Label>
                <div>
                  <Button variant="outline" onClick={() => {
                    sessionStorage.removeItem("steadywheelhub.tutorialDismissed");
                    sessionStorage.setItem("steadywheelhub.tutorialStep", "0");
                    onOpenChange(false);
                    window.location.href = "/";
                  }}>
                    {t("settings.restartTutorial") || "Restart Tutorial"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("settings.restartTutorialDesc") || "Click to view the app tour again from the beginning."}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notify" className="space-y-4 mt-0 pt-0">
              <Row label={t("settings.overdueServices")} description={t("settings.overdueServicesDesc")} checked={notifyOverdue} onChange={setNotifyOverdue} />
              <Row label={t("settings.upcomingReminders")} description={t("settings.upcomingRemindersDesc")} checked={notifyUpcoming} onChange={setNotifyUpcoming} />
              <Row label={t("settings.emailDigests")} description={t("settings.emailDigestsDesc")} checked={notifyEmail} onChange={setNotifyEmail} />
              <Row label={t("settings.emailDigestsMonthly")} description={t("settings.emailDigestsMonthlyDesc")} checked={notifyEmailMonthly} onChange={setNotifyEmailMonthly} />
            </TabsContent>

            <TabsContent value="a11y" className="space-y-4 mt-0 pt-0">
              <p className="text-xs text-muted-foreground">{t("settings.wcagCompliance")}</p>
              <Row label={t("settings.highContrast")} description={t("settings.highContrastDesc")} checked={highContrast} onChange={setHighContrast} />
              <Row label={t("settings.reduceMotion")} description={t("settings.reduceMotionDesc")} checked={reduceMotion} onChange={setReduceMotion} />
              <Row label={t("settings.dyslexia")} description={t("settings.dyslexiaDesc")} checked={dyslexiaFont} onChange={setDyslexiaFont} />
              <Row label={t("settings.underlineLinks")} description={t("settings.underlineLinksDesc")} checked={underlineLinks} onChange={setUnderlineLinks} />
              <div className="space-y-2 rounded-xl border border-border p-3">
                <Label htmlFor="font-scale">{t("settings.textSize")}</Label>
                <Select value={fontScale} onValueChange={(v) => setFontScale(v as FontScale)}>
                  <SelectTrigger id="font-scale"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{t("settings.textSizeNormal")}</SelectItem>
                    <SelectItem value="large">{t("settings.textSizeLarge")}</SelectItem>
                    <SelectItem value="xl">{t("settings.textSizeXL")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("settings.textSizeDesc")}</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || uploadingPhoto}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving || uploadingPhoto} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {saving ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}