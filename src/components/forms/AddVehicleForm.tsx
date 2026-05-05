import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import type { Vehicle } from "@/data/mockData";

type Props = {
  onClose: () => void;
  initialVehicle?: Vehicle;
};

export function AddVehicleForm({ onClose, initialVehicle }: Props) {
  const { addVehicle, updateVehicle } = useGarageData();
  const [brand, setBrand] = useState(initialVehicle?.brand ?? "");
  const [model, setModel] = useState(initialVehicle?.model ?? "");
  const [year, setYear] = useState(String(initialVehicle?.year ?? ""));
  const [mileage, setMileage] = useState(String(initialVehicle?.mileage ?? ""));
  const [plate, setPlate] = useState(initialVehicle?.plate ?? "");
  const [color, setColor] = useState(initialVehicle?.color ?? "white");
  const isEditing = Boolean(initialVehicle);

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const nextVehicle = {
        brand,
        model,
        year: Number(year) || new Date().getFullYear(),
        mileage: Number(mileage) || 0,
        plate,
        color,
        nextService: initialVehicle?.nextService ?? new Date().toISOString().slice(0, 10),
      };

      if (initialVehicle) {
        updateVehicle(initialVehicle.id, nextVehicle);
      } else {
        addVehicle(nextVehicle);
      }

      onClose();
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="brand" label="Brand"><Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Tesla" /></Field>
        <Field id="model" label="Model"><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model 3" /></Field>
        <Field id="year" label="Year"><Input id="year" value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="2024" /></Field>
        <Field id="mileage" label="Mileage (mi)"><Input id="mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} type="number" placeholder="12000" /></Field>
        <Field id="plate" label="License plate"><Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC-1234" /></Field>
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
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">{isEditing ? "Save changes" : "Add vehicle"}</Button>
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
