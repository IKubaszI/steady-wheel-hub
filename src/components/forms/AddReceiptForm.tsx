import { useState, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MAX_RECEIPT_FILES, MAX_RECEIPT_FILE_SIZE_BYTES } from "@/lib/schemas";
import { formatAppError } from "@/lib/errors";
import { useEffect } from "react";

type Props = {
  onClose: () => void;
  defaultCategory?: Category;
  defaultVehicleId?: string;
  initialReceipt?: Receipt;
};

type PhotoItem = {
  id: string;
  url: string;
  file?: File;
};

export function AddReceiptForm({ onClose, defaultCategory = "fuel", defaultVehicleId, initialReceipt }: Props) {
  const { vehicles, addReceipt, updateReceipt } = useGarageData();
  const { toast } = useToast();
  const [vendor, setVendor] = useState(initialReceipt?.vendor ?? "");
  const [amount, setAmount] = useState(String(initialReceipt?.amount ?? ""));
  const [vehicleId, setVehicleId] = useState(initialReceipt?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? "");
  const [category, setCategory] = useState<Category>(initialReceipt?.category ?? defaultCategory);
  const [date, setDate] = useState(initialReceipt?.date ?? new Date().toISOString().slice(0, 10));
  const [fuelLiters, setFuelLiters] = useState(initialReceipt?.fuelLiters != null ? String(initialReceipt.fuelLiters) : "");
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (initialReceipt?.photos ?? []).map((url, index) => ({ id: `existing-${index}`, url }))
  );
  const [busy, setBusy] = useState(false);
  const isEditing = Boolean(initialReceipt);

  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicleId, vehicles]);

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    const newPreviews = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
      })
    );

    const newItems: PhotoItem[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      file,
      url: newPreviews[index],
    }));

    setPhotoItems((current) => [...current, ...newItems]);
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotoItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!vendor.trim()) {
        toast({
          title: "Vendor required",
          description: "Enter vendor/store name before saving the receipt.",
          variant: "destructive",
        });
        return;
      }
      if (!vehicleId.trim()) {
        toast({
          title: "Vehicle required",
          description: "Add a vehicle first or pick an existing vehicle for this receipt.",
          variant: "destructive",
        });
        return;
      }
      if ((Number(amount) || 0) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Receipt amount must be greater than 0.",
          variant: "destructive",
        });
        return;
      }
      const existingPhotoUrls = photoItems.filter((item) => !item.file).map((item) => item.url);
      const newFiles = photoItems.filter((item) => item.file).map((item) => item.file as File);
      if (photoItems.length > MAX_RECEIPT_FILES) {
        toast({
          title: "Too many files",
          description: `You can upload up to ${MAX_RECEIPT_FILES} files for one receipt.`,
          variant: "destructive",
        });
        return;
      }
      if (newFiles.some((file) => file.size > MAX_RECEIPT_FILE_SIZE_BYTES)) {
        toast({
          title: "File too large",
          description: "One of selected files exceeds 15MB before compression.",
          variant: "destructive",
        });
        return;
      }

      const nextReceipt = {
        vendor: vendor.trim(),
        amount: Number(amount) || 0,
        vehicleId,
        category,
        date,
        fuelLiters: category === "fuel" ? Number(fuelLiters) || undefined : undefined,
        photos: existingPhotoUrls,
      };
      try {
        setBusy(true);
        if (initialReceipt) {
          await updateReceipt(initialReceipt.id, nextReceipt, newFiles);
          toast({ title: "Receipt updated", description: "Receipt changes were saved successfully." });
        } else {
          await addReceipt(nextReceipt, newFiles);
          toast({ title: "Receipt added", description: "Receipt was added successfully." });
        }
        onClose();
      } catch (error) {
        const message = formatAppError(error, "Could not save receipt.");
        toast({ title: "Save failed", description: message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vendor" label="Vendor"><Input id="vendor" maxLength={160} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Shell Premium" /></Field>
        <Field id="amount" label="Amount ($)"><Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="62.80" /></Field>
        <Field id="vehicle" label="Vehicle tag">
          <Select value={vehicleId} onValueChange={setVehicleId}><SelectTrigger id="vehicle"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="category" label="Category">
          <Select value={category} onValueChange={(value) => setCategory(value as Category)}><SelectTrigger id="category"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {Object.entries(categoryMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="date" label="Date"><Input id="date" value={date} onChange={(e) => setDate(e.target.value)} type="date" /></Field>
        {category === "fuel" && (
          <Field id="fuelLiters" label="Fuel liters (L)"><Input id="fuelLiters" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} type="number" step="0.1" placeholder="31.4" /></Field>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photos" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Receipt photos</Label>
        <Input id="photos" type="file" accept="image/*" multiple onChange={handlePhotoSelect} />
        <div className="grid grid-cols-4 gap-2">
          {photoItems.map((item, index) => (
            <div key={item.id} className="relative group">
              <div className="aspect-[3/4] w-full rounded-lg border border-border bg-secondary/40 overflow-hidden">
                <img src={item.url} alt={`Preview ${index + 1}`} className="h-full w-full object-contain p-1" />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(item.id)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {photoItems.length === 0 && (
          <span className="text-xs text-muted-foreground">
            You can attach up to {MAX_RECEIPT_FILES} images (15MB each, auto-compressed).
          </span>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" disabled={vehicles.length === 0 || busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? "Saving..." : isEditing ? "Save changes" : "Save receipt"}
        </Button>
      </div>
      {vehicles.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add a vehicle first before creating receipts.
        </p>
      )}
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
