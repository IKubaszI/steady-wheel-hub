import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Maintenance, type ServiceStatus } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { useSettings } from "@/context/settings";

export function EditMaintenanceForm({ entry, onClose }: { entry: Maintenance; onClose: () => void }) {
  const { vehicles, updateMaintenance } = useGarageData();
  const { toast } = useToast();
  const { t, symbol } = useSettings();
  const [vehicleId, setVehicleId] = useState(entry.vehicleId);
  const [type, setType] = useState(entry.type);
  const [date, setDate] = useState(entry.date);
  const [cost, setCost] = useState(String(entry.cost));
  const [notes, setNotes] = useState(entry.notes);
  const [status, setStatus] = useState<ServiceStatus>(entry.status);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!vehicleId || !type.trim()) return;
        try {
          setBusy(true);
          await updateMaintenance(entry.id, {
            vehicleId,
            type: type.trim(),
            date,
            cost: Number(cost) || 0,
            status,
            notes: notes.trim(),
          });
          toast({ title: t("maintenance.toast.updated"), description: t("maintenance.toast.updatedDesc") });
          onClose();
        } catch (error) {
          const message = formatAppError(error, "Could not update maintenance.");
          toast({ title: t("maintenance.toast.updateFailed"), description: message, variant: "destructive" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field id="vehicle" label={t("common.vehicle")}>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="vehicle"><SelectValue /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="type" label={t("form.service.type")}><Input id="type" maxLength={120} value={type} onChange={(e) => setType(e.target.value)} placeholder={t("form.service.typePlaceholder")} /></Field>
        <Field id="date" label={t("common.date")}><Input id="date" value={date} onChange={(e) => setDate(e.target.value)} type="date" /></Field>
        <Field id="cost" label={`${t("form.service.cost")} (${symbol})`}><Input id="cost" value={cost} onChange={(e) => setCost(e.target.value)} type="number" step="0.01" /></Field>
        <Field id="status" label={t("common.status")}>
          <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus)}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
              <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
              <SelectItem value="completed">{t("status.completed")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id="notes" label={t("form.service.notes")}><Textarea id="notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("form.service.notesPlaceholder")} /></Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? t("common.saving") : t("form.saveChanges")}
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}