import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import type { Vehicle } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { useSettings } from "@/context/settings";

type Props = {
  onClose: () => void;
  initialVehicle?: Vehicle;
};

export function AddVehicleForm({ onClose, initialVehicle }: Props) {
  const { addVehicle, updateVehicle } = useGarageData();
  const { toast } = useToast();
  const { t, distanceUnit } = useSettings();
  const [brand, setBrand] = useState(initialVehicle?.brand ?? "");
  const [model, setModel] = useState(initialVehicle?.model ?? "");
  const [year, setYear] = useState(String(initialVehicle?.year ?? ""));
  const [mileage, setMileage] = useState(String(initialVehicle?.mileage ?? ""));
  const [plate, setPlate] = useState(initialVehicle?.plate ?? "");
  const [color, setColor] = useState(initialVehicle?.color ?? "white");
  const [busy, setBusy] = useState(false);
  const isEditing = Boolean(initialVehicle);

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!brand.trim()) {
        toast({ title: t("validate.brandRequired"), description: t("validate.brandDesc"), variant: "destructive" });
        return;
      }
      if (!model.trim()) {
        toast({ title: t("validate.modelRequired"), description: t("validate.modelDesc"), variant: "destructive" });
        return;
      }
      if (!plate.trim()) {
        toast({ title: t("validate.plateRequired"), description: t("validate.plateDesc"), variant: "destructive" });
        return;
      }
      const parsedYear = Number(year) || new Date().getFullYear();
      if (parsedYear < 1900 || parsedYear > 2100) {
        toast({ title: t("validate.yearInvalid"), description: t("validate.yearDesc"), variant: "destructive" });
        return;
      }
      const nextVehicle = {
        brand: brand.trim(),
        model: model.trim(),
        year: parsedYear,
        mileage: Number(mileage) || 0,
        plate: plate.trim().toUpperCase(),
        color,
        nextService: initialVehicle?.nextService ?? new Date().toISOString().slice(0, 10),
      };

      try {
        setBusy(true);
        if (initialVehicle) {
          await updateVehicle(initialVehicle.id, nextVehicle);
          toast({ title: t("vehicles.toast.updated"), description: t("vehicles.toast.updatedDesc") });
        } else {
          await addVehicle(nextVehicle);
          toast({ title: t("vehicles.toast.added"), description: t("vehicles.toast.addedDesc") });
        }
        onClose();
      } catch (error) {
        const message = formatAppError(error, "Could not save vehicle.");
        toast({ title: t("vehicles.toast.saveFailed"), description: message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="brand" label={t("form.brand")}><Input id="brand" maxLength={80} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Tesla" /></Field>
        <Field id="model" label={t("form.model")}><Input id="model" maxLength={120} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model 3" /></Field>
        <Field id="year" label={t("form.year")}><Input id="year" value={year} onChange={(e) => setYear(e.target.value)} type="number" /></Field>
        <Field id="mileage" label={`${t("form.mileage")} (${distanceUnit})`}><Input id="mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} type="number" /></Field>
        <Field id="plate" label={t("form.licensePlate")}><Input id="plate" maxLength={24} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC-1234" /></Field>
        <Field id="color" label={t("form.color")}>
          <Select value={color} onValueChange={setColor}><SelectTrigger id="color"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="white">{t("color.white")}</SelectItem>
              <SelectItem value="black">{t("color.black")}</SelectItem>
              <SelectItem value="silver">{t("color.silver")}</SelectItem>
              <SelectItem value="red">{t("color.red")}</SelectItem>
              <SelectItem value="blue">{t("color.blue")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? t("common.saving") : isEditing ? t("form.saveChanges") : t("form.addVehicle")}
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
