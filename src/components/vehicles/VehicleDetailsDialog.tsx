import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Car, Gauge, Calendar, Palette, Fuel, Wrench, ReceiptText, Pencil, ImagePlus, X, Check, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import type { Vehicle } from "@/data/mockData";
import { CAR_BRANDS, findBrandLogo } from "@/lib/car-brands";
import { VEHICLE_THEMES, VEHICLE_PATTERNS } from "@/lib/vehicle-themes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: { vehicle: Vehicle | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { receipts, maintenance, updateVehicle } = useGarageData();
  const { format: fmtMoney } = useSettings();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Vehicle | null>(vehicle);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(vehicle); setEditing(false); }, [vehicle, open]);

  if (!vehicle || !draft) return null;

  const vReceipts = receipts.filter((r) => r.vehicleId === vehicle.id);
  const vServices = maintenance.filter((m) => m.vehicleId === vehicle.id);
  const totalSpent = vReceipts.reduce((s, r) => s + r.amount, 0) + vServices.reduce((s, m) => s + m.cost, 0);
  const fuelLiters = vReceipts.filter((r) => r.category === "fuel").reduce((s, r) => s + (r.fuelLiters ?? 0), 0);

  const logoSrc = draft.logoUrl ?? findBrandLogo(draft.brand);
  const bgSrc = draft.image;

  const onPickPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => d ? { ...d, image: String(reader.result) } : d);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!draft) return;
    const { id, ...rest } = draft;
    try {
      await updateVehicle(id, rest);
      toast({ title: "Vehicle updated", description: "Vehicle details were saved successfully." });
      setEditing(false);
    } catch (error) {
      const message = formatAppError(error, "Could not save changes.");
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Hero with blurred bg */}
        <div className="relative overflow-hidden rounded-t-lg">
          {bgSrc ? (
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{ backgroundImage: `url(${bgSrc})`, filter: "blur(14px) saturate(1.05)" }}
              aria-hidden
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-primary opacity-30" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" aria-hidden />
          <DialogHeader className="relative p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-card/90 backdrop-blur grid place-items-center shadow-elev-md ring-1 ring-border overflow-hidden">
                {logoSrc ? (
                  <img src={logoSrc} alt={`${draft.brand} logo`} className="h-10 w-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <Car className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="font-display text-2xl truncate">{draft.brand} {draft.model}</DialogTitle>
                <DialogDescription className="truncate">
                  {draft.year} · {draft.color} · <span className="font-mono">{draft.plate}</span>
                </DialogDescription>
              </div>
              {!editing ? (
                <Button size="sm" variant="outline" className="gap-2 backdrop-blur bg-card/80" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setDraft(vehicle); setEditing(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground gap-1" onClick={save}>
                    <Check className="h-4 w-4" /> Save
                  </Button>
                </div>
              )}
            </div>

            {editing && (
              <div className="mt-4 flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickPhoto(f); }}
                />
                <Button size="sm" variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> {bgSrc ? "Change photo" : "Add photo"}
                </Button>
                {bgSrc && (
                  <Button size="sm" variant="ghost" onClick={() => setDraft((d) => d ? { ...d, image: undefined } : d)}>
                    Remove photo
                  </Button>
                )}
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">

        {editing && (
          <section className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3 animate-fade-in">
            <h4 className="text-sm font-semibold">Vehicle details</h4>
            <div className="grid grid-cols-2 gap-3">
              <FieldEditor label="Brand">
                <Select value={draft.brand} onValueChange={(v) => setDraft((d) => d ? { ...d, brand: v, logoUrl: findBrandLogo(v) ?? undefined } : d)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CAR_BRANDS.map((b) => (
                      <SelectItem key={b.slug} value={b.name}>
                        <span className="inline-flex items-center gap-2">
                          <img src={b.logo} alt="" className="h-4 w-4 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                          {b.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldEditor>
              <FieldEditor label="Model">
                <Input value={draft.model} onChange={(e) => setDraft((d) => d ? { ...d, model: e.target.value } : d)} />
              </FieldEditor>
              <FieldEditor label="Year">
                <Input type="number" value={draft.year} onChange={(e) => setDraft((d) => d ? { ...d, year: Number(e.target.value) || d.year } : d)} />
              </FieldEditor>
              <FieldEditor label="Mileage">
                <Input type="number" value={draft.mileage} onChange={(e) => setDraft((d) => d ? { ...d, mileage: Number(e.target.value) || 0 } : d)} />
              </FieldEditor>
              <FieldEditor label="License plate">
                <Input value={draft.plate} onChange={(e) => setDraft((d) => d ? { ...d, plate: e.target.value } : d)} />
              </FieldEditor>
              <FieldEditor label="Color">
                <Input value={draft.color} onChange={(e) => setDraft((d) => d ? { ...d, color: e.target.value } : d)} />
              </FieldEditor>
              <FieldEditor label="Next service">
                <Input type="date" value={draft.nextService} onChange={(e) => setDraft((d) => d ? { ...d, nextService: e.target.value } : d)} />
              </FieldEditor>
            </div>

            <div className="pt-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Card theme</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {VEHICLE_THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setDraft((d) => d ? { ...d, theme: t.key } : d)}
                    className={cn(
                      "h-12 rounded-lg ring-1 ring-border text-[10px] font-semibold transition-all hover:scale-[1.03]",
                      t.cardClass || "bg-card",
                      (draft.theme ?? "default") === t.key && "ring-2 ring-primary"
                    )}
                    aria-label={t.label}
                    title={t.label}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pattern</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {VEHICLE_PATTERNS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setDraft((d) => d ? { ...d, pattern: p.key } : d)}
                    className={cn(
                      "h-10 rounded-lg ring-1 ring-border bg-secondary text-foreground/70 relative overflow-hidden text-[11px] font-medium transition-all hover:scale-[1.03]",
                      (draft.pattern ?? "none") === p.key && "ring-2 ring-primary"
                    )}
                  >
                    {p.style && <span className="absolute inset-0" style={p.style} aria-hidden />}
                    <span className="relative">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <Stat icon={Gauge} label="Mileage" value={`${(draft.mileage / 1000).toFixed(1)}k mi`} />
          <Stat icon={Calendar} label="Next service" value={format(parseISO(draft.nextService), "MMM d")} />
          <Stat icon={Palette} label="Color" value={draft.color.split(" ")[0]} />
          <Stat icon={Fuel} label="Fuel logged" value={`${fuelLiters.toFixed(0)} L`} />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Tile label="Total spend" value={fmtMoney(totalSpent, { decimals: 0 })} />
          <Tile label="Receipts" value={String(vReceipts.length)} />
          <Tile label="Services" value={String(vServices.length)} />
        </div>

        <section className="mt-6">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-primary" /> Recent services</h4>
          <ul className="space-y-2">
            {vServices.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.type}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(m.date), "MMM d, yyyy")}</p>
                </div>
                <Badge variant="secondary" className="capitalize rounded-full">{m.status}</Badge>
              </li>
            ))}
            {vServices.length === 0 && <li className="text-sm text-muted-foreground italic">No services yet</li>}
          </ul>
        </section>

        <section className="mt-5">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><ReceiptText className="h-4 w-4 text-primary" /> Recent receipts</h4>
          <ul className="space-y-2">
            {vReceipts.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.vendor}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.category} · {format(parseISO(r.date), "MMM d, yyyy")}</p>
                </div>
                <p className="text-sm font-bold tabular-nums">{fmtMoney(r.amount)}</p>
              </li>
            ))}
            {vReceipts.length === 0 && <li className="text-sm text-muted-foreground italic">No receipts yet</li>}
          </ul>
        </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span></div>
      <p className="font-display font-bold mt-0.5">{value}</p>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}