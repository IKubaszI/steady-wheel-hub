import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicles } from "@/data/mockData";

export function AddMaintenanceForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vehicle" label="Vehicle">
          <Select><SelectTrigger id="vehicle"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="type" label="Service type"><Input id="type" placeholder="Oil change" /></Field>
        <Field id="date" label="Date"><Input id="date" type="date" /></Field>
        <Field id="cost" label="Cost ($)"><Input id="cost" type="number" step="0.01" placeholder="89.50" /></Field>
      </div>
      <Field id="notes" label="Notes"><Textarea id="notes" rows={3} placeholder="Synthetic 5W-30, check brakes…" /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">Add entry</Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: any) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
