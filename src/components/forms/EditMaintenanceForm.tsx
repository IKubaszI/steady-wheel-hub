import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Maintenance, type ServiceStatus } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";

export function EditMaintenanceForm({ entry, onClose }: { entry: Maintenance; onClose: () => void }) {
  const { vehicles, updateMaintenance } = useGarageData();
  const [vehicleId, setVehicleId] = useState(entry.vehicleId);
  const [type, setType] = useState(entry.type);
  const [date, setDate] = useState(entry.date);
  const [cost, setCost] = useState(String(entry.cost));
  const [notes, setNotes] = useState(entry.notes);
  const [status, setStatus] = useState<ServiceStatus>(entry.status);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!vehicleId || !type.trim()) return;
        updateMaintenance(entry.id, {
          vehicleId,
          type: type.trim(),
          date,
          cost: Number(cost) || 0,
          status,
          notes: notes.trim(),
        });
        onClose();
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field id="vehicle" label="Vehicle">
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="vehicle"><SelectValue /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="type" label="Service type"><Input id="type" value={type} onChange={(e) => setType(e.target.value)} /></Field>
        <Field id="date" label="Date"><Input id="date" value={date} onChange={(e) => setDate(e.target.value)} type="date" /></Field>
        <Field id="cost" label="Cost ($)"><Input id="cost" value={cost} onChange={(e) => setCost(e.target.value)} type="number" step="0.01" /></Field>
        <Field id="status" label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus)}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id="notes" label="Notes"><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">Save changes</Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: any) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}