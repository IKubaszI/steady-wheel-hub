import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicles, categoryMeta } from "@/data/mockData";

export function AddReceiptForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vendor" label="Vendor"><Input id="vendor" placeholder="Shell Premium" /></Field>
        <Field id="amount" label="Amount ($)"><Input id="amount" type="number" step="0.01" placeholder="62.80" /></Field>
        <Field id="vehicle" label="Vehicle">
          <Select><SelectTrigger id="vehicle"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="category" label="Category">
          <Select><SelectTrigger id="category"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="date" label="Date"><Input id="date" type="date" /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">Save receipt</Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: any) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
