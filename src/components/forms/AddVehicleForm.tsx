import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddVehicleForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="brand" label="Brand"><Input id="brand" placeholder="Tesla" /></Field>
        <Field id="model" label="Model"><Input id="model" placeholder="Model 3" /></Field>
        <Field id="year" label="Year"><Input id="year" type="number" placeholder="2024" /></Field>
        <Field id="mileage" label="Mileage (mi)"><Input id="mileage" type="number" placeholder="12000" /></Field>
        <Field id="plate" label="License plate"><Input id="plate" placeholder="ABC-1234" /></Field>
        <Field id="color" label="Color">
          <Select><SelectTrigger id="color"><SelectValue placeholder="Select color" /></SelectTrigger>
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
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">Add vehicle</Button>
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
