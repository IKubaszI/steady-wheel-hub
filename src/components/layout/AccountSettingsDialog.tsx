import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AccountSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@garageos.app");
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyUpcoming, setNotifyUpcoming] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const save = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    onOpenChange(false);
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
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">AM</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">Change photo</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Full name</Label>
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-email">Email</Label>
              <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <Input defaultValue="USD" />
            </div>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4 pt-4 animate-fade-in">
            <Row label="Overdue services" description="Alert when a service is past due" checked={notifyOverdue} onChange={setNotifyOverdue} />
            <Row label="Upcoming reminders" description="Notify 7 days before scheduled service" checked={notifyUpcoming} onChange={setNotifyUpcoming} />
            <Row label="Email digests" description="Weekly expense summary by email" checked={notifyEmail} onChange={setNotifyEmail} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-primary text-primary-foreground hover:opacity-90">Save changes</Button>
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