import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { type Category, type ServiceStatus } from "@/data/mockData";
import { categoryMeta } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { type TranslationKey } from "@/lib/translations";

export interface AssistantConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedData: {
    type: "receipt" | "maintenance";
    data: {
      vehicleId?: string | null;
      vendor?: string;
      category?: Category;
      amount?: number;
      date?: string;
      fuelLiters?: number;
      type?: string;
      cost?: number;
      status?: ServiceStatus;
      notes?: string;
    };
  } | null;
  onSaveSuccess: () => void;
}

export function AssistantConfirmDialog({
  open,
  onOpenChange,
  parsedData,
  onSaveSuccess,
}: AssistantConfirmDialogProps) {
  const { vehicles, addReceipt, addMaintenance } = useGarageData();
  const { t, symbol } = useSettings();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);

  // Form states
  const [type, setType] = useState<"receipt" | "maintenance">("receipt");
  const [vehicleId, setVehicleId] = useState("");
  
  // Receipt fields
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [fuelLiters, setFuelLiters] = useState("");

  // Maintenance fields
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("upcoming");
  const [notes, setNotes] = useState("");

  // Populate states when parsedData changes
  useEffect(() => {
    if (!parsedData) return;

    const { type: commandType, data } = parsedData;
    setType(commandType);

    // Find matched vehicle or default to first vehicle
    const matchedVehicle = vehicles.find((v) => v.id === data.vehicleId) || vehicles[0];
    setVehicleId(matchedVehicle?.id ?? "");

    if (commandType === "receipt") {
      setVendor(data.vendor || "");
      setCategory(data.category || "fuel");
      setAmount(data.amount != null ? String(data.amount) : "");
      setDate(data.date || new Date().toISOString().slice(0, 10));
      setFuelLiters(data.fuelLiters != null ? String(data.fuelLiters) : "");
    } else {
      setServiceType(data.type || "");
      setCost(data.cost != null ? String(data.cost) : "0");
      setStatus(data.status || "upcoming");
      setDate(data.date || new Date().toISOString().slice(0, 10));
      setNotes(data.notes || "");
    }
  }, [parsedData, vehicles]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast({
        title: t("validate.vehicleRequired"),
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      if (type === "receipt") {
        if (!vendor.trim()) {
          toast({
            title: t("validate.vendorRequired"),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }
        if (Number(amount) <= 0 || isNaN(Number(amount))) {
          toast({
            title: t("validate.amountPositive"),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }

        await addReceipt({
          vehicleId,
          vendor: vendor.trim(),
          category,
          amount: Number(amount),
          date,
          fuelLiters: category === "fuel" && fuelLiters ? Number(fuelLiters) : undefined,
          photos: [],
        });

        toast({
          title: t("receipt.toast.added"),
          description: t("receipt.toast.addedDesc"),
        });
      } else {
        if (!serviceType.trim()) {
          toast({
            title: t("form.service.type") + " required",
            variant: "destructive",
          });
          setBusy(false);
          return;
        }

        await addMaintenance({
          vehicleId,
          type: serviceType.trim(),
          date,
          cost: Number(cost) || 0,
          status,
          notes: notes.trim(),
        });

        toast({
          title: t("maintenance.toast.added"),
          description: t("maintenance.toast.addedDesc"),
        });
      }

      onSaveSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = formatAppError(err, "Could not save entry.");
      toast({
        title: type === "receipt" ? t("receipt.toast.saveFailed") : t("maintenance.toast.saveFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border border-border/80 bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            ✨ {t("assistant.confirm.title")}
          </DialogTitle>
          <DialogDescription>
            {t("assistant.confirm.desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          {/* Shared Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("assistant.confirm.type")}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "receipt" ? "default" : "outline"}
                  onClick={() => setType("receipt")}
                  className="flex-1 text-xs"
                >
                  {t("assistant.btn.receipt")}
                </Button>
                <Button
                  type="button"
                  variant={type === "maintenance" ? "default" : "outline"}
                  onClick={() => setType("maintenance")}
                  className="flex-1 text-xs"
                >
                  {t("assistant.btn.maintenance")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="assistant-vehicle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("common.vehicle")}
              </Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="assistant-vehicle">
                  <SelectValue placeholder={t("vehicles.selectVehicle")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} · {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Form Fields */}
          {type === "receipt" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assistant-vendor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.vendor")}
                </Label>
                <Input
                  id="assistant-vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Shell, Orlen, BP..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.amount")} ({symbol})
                </Label>
                <Input
                  id="assistant-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.category")}
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as Category)}
                >
                  <SelectTrigger id="assistant-category">
                    <SelectValue placeholder={t("common.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryMeta).map(([k, m]) => (
                      <SelectItem key={k} value={k}>
                        {t(`category.${k}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.date")}
                </Label>
                <Input
                  id="assistant-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {category === "fuel" && (
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="assistant-liters" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("form.receipt.fuelLiters")} (l)
                  </Label>
                  <Input
                    id="assistant-liters"
                    type="number"
                    step="0.1"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    placeholder="30.5"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-service-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.type")}
                </Label>
                <Input
                  id="assistant-service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder={t("form.service.typePlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-cost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.cost")} ({symbol})
                </Label>
                <Input
                  id="assistant-cost"
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.status")}
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as ServiceStatus)}
                >
                  <SelectTrigger id="assistant-status">
                    <SelectValue placeholder={t("maintenance.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
                    <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
                    <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.date")}
                </Label>
                <Input
                  id="assistant-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.notes")}
                </Label>
                <Textarea
                  id="assistant-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("form.service.notesPlaceholder")}
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={busy || vehicles.length === 0}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            >
              {busy ? t("common.saving") : t("assistant.confirm.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
