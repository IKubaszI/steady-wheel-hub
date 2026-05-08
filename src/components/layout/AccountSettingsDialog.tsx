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
import { useSettings, type Currency, type PrimaryColor } from "@/context/settings";
import { useAuth } from "@/context/auth";
import { uploadImage } from "@/services/cloudinaryService";
import { formatAppError } from "@/lib/errors";
import { userDisplayNameSchema } from "@/lib/schemas";

export function AccountSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { currency, setCurrency, primaryColor, setPrimaryColor, format: fmtMoney } = useSettings();
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyUpcoming, setNotifyUpcoming] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      const parsedName = userDisplayNameSchema.safeParse(name);
      if (!parsedName.success) {
        throw parsedName.error;
      }
      await updateUserProfile({ displayName: parsedName.data, photoURL: photoUrl || undefined });
      toast({ title: "Settings saved", description: "Your profile preferences have been updated." });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Save failed", description: formatAppError(error, "Could not update profile."), variant: "destructive" });
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
      toast({ title: "Invalid file", description: "Select an image file for profile photo.", variant: "destructive" });
      return;
    }
    try {
      setUploadingPhoto(true);
      const uploaded = await uploadImage(file);
      setPhotoUrl(uploaded.secureUrl);
      toast({ title: "Photo uploaded", description: "Save changes to apply this profile photo." });
    } catch (error) {
      toast({ title: "Upload failed", description: formatAppError(error, "Could not upload profile photo."), variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Account settings</DialogTitle>
          <DialogDescription>Manage your profile, preferences, and notifications.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="prefs">Preferences</TabsTrigger>
            <TabsTrigger value="notify">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-background shadow-elev-sm">
                {photoUrl ? <AvatarImage src={photoUrl} alt={name || "Profile photo"} /> : null}
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                  {name.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                {uploadingPhoto ? "Uploading..." : "Change photo"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Full name</Label>
              <Input id="acc-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-email">Email</Label>
              <Input id="acc-email" maxLength={254} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">Email change requires secure re-authentication and is currently read-only.</p>
            </div>
          </TabsContent>

          <TabsContent value="prefs" className="space-y-4 pt-4 animate-fade-in">
            <div className="space-y-2">
              <Label>Distance units</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={units === "imperial" ? "default" : "outline"} onClick={() => setUnits("imperial")}>Imperial (mi)</Button>
                <Button variant={units === "metric" ? "default" : "outline"} onClick={() => setUnits("metric")}>Metric (km)</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
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
              <p className="text-xs text-muted-foreground">Preview: {fmtMoney(1234.5)}</p>
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Select value={primaryColor} onValueChange={(v) => setPrimaryColor(v as PrimaryColor)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocean">Ocean blue</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="rose">Rose</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Updates buttons, highlights, and charts across the app.</p>
            </div>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4 pt-4 animate-fade-in">
            <Row label="Overdue services" description="Alert when a service is past due" checked={notifyOverdue} onChange={setNotifyOverdue} />
            <Row label="Upcoming reminders" description="Notify 7 days before scheduled service" checked={notifyUpcoming} onChange={setNotifyUpcoming} />
            <Row label="Email digests" description="Weekly expense summary by email" checked={notifyEmail} onChange={setNotifyEmail} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || uploadingPhoto}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploadingPhoto} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {saving ? "Saving..." : "Save changes"}
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