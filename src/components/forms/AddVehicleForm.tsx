import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import type { Vehicle } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";

type Props = {
  onClose: () => void;
  initialVehicle?: Vehicle;
};

export function AddVehicleForm({ onClose, initialVehicle }: Props) {
  const { addVehicle, updateVehicle } = useGarageData();
  const { toast } = useToast();
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
        toast({ title: "Brand required", description: "Enter a vehicle brand.", variant: "destructive" });
        return;
      }
      if (!model.trim()) {
        toast({ title: "Model required", description: "Enter a vehicle model.", variant: "destructive" });
        return;
      }
      if (!plate.trim()) {
        toast({ title: "License plate required", description: "Enter a license plate.", variant: "destructive" });
        return;
      }
      const parsedYear = Number(year) || new Date().getFullYear();
      if (parsedYear < 1900 || parsedYear > 2100) {
        toast({ title: "Invalid year", description: "Year must be between 1900 and 2100.", variant: "destructive" });
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
          toast({ title: "Vehicle updated", description: "Vehicle details were saved successfully." });
        } else {
          await addVehicle(nextVehicle);
          toast({ title: "Vehicle added", description: "Vehicle was added successfully." });
        }
        onClose();
      } catch (error) {
        const message = formatAppError(error, "Could not save vehicle.");
        toast({ title: "Save failed", description: message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="brand" label="Brand"><Input id="brand" maxLength={80} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Tesla" /></Field>
        <Field id="model" label="Model"><Input id="model" maxLength={120} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model 3" /></Field>
        <Field id="year" label="Year"><Input id="year" value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="2024" /></Field>
        <Field id="mileage" label="Mileage (mi)"><Input id="mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} type="number" placeholder="12000" /></Field>
        <Field id="plate" label="License plate"><Input id="plate" maxLength={24} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC-1234" /></Field>
        <Field id="color" label="Color">
          <Select value={color} onValueChange={setColor}><SelectTrigger id="color"><SelectValue placeholder="Select color" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? "Saving..." : isEditing ? "Save changes" : "Add vehicle"}
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
