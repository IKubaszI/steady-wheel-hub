import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ServiceStatus } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";

export function AddMaintenanceForm({ onClose }: { onClose: () => void }) {
  const { vehicles, addMaintenance } = useGarageData();
  const { toast } = useToast();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [type, setType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("upcoming");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!vehicleId || !type.trim()) {
          return;
        }

        try {
          setBusy(true);
          await addMaintenance({
            vehicleId,
            type: type.trim(),
            date,
            cost: Number(cost) || 0,
            status,
            notes: notes.trim(),
          });
          toast({ title: "Maintenance added", description: "Maintenance entry was added successfully." });
          onClose();
        } catch (error) {
          const message = formatAppError(error, "Could not save maintenance.");
          toast({ title: "Save failed", description: message, variant: "destructive" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field id="vehicle" label="Vehicle">
          <Select value={vehicleId} onValueChange={setVehicleId}><SelectTrigger id="vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="type" label="Service type"><Input id="type" maxLength={120} value={type} onChange={(e) => setType(e.target.value)} placeholder="Oil change" /></Field>
        <Field id="date" label="Date"><Input id="date" value={date} onChange={(e) => setDate(e.target.value)} type="date" /></Field>
        <Field id="cost" label="Cost ($)"><Input id="cost" value={cost} onChange={(e) => setCost(e.target.value)} type="number" step="0.01" placeholder="89.50" /></Field>
        <Field id="status" label="Status">
          <Select value={status} onValueChange={(value) => setStatus(value as ServiceStatus)}>
            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id="notes" label="Notes"><Textarea id="notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Synthetic 5W-30, check brakes…" /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? "Saving..." : "Add entry"}
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: any) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
