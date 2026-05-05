import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { X } from "lucide-react";

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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export function AddReceiptForm({ onClose, defaultCategory = "fuel", defaultVehicleId, initialReceipt }: Props) {
  const { vehicles, addReceipt, updateReceipt } = useGarageData();
  const [vendor, setVendor] = useState(initialReceipt?.vendor ?? "");
  const [amount, setAmount] = useState(String(initialReceipt?.amount ?? ""));
  const [vehicleId, setVehicleId] = useState(initialReceipt?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? "");
  const [category, setCategory] = useState<Category>(initialReceipt?.category ?? defaultCategory);
  const [date, setDate] = useState(initialReceipt?.date ?? new Date().toISOString().slice(0, 10));
  const [fuelLiters, setFuelLiters] = useState(initialReceipt?.fuelLiters != null ? String(initialReceipt.fuelLiters) : "");
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (initialReceipt?.photos ?? []).map((url, index) => ({ id: `existing-${index}`, url }))
  );
  const isEditing = Boolean(initialReceipt);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const photoUrls = await Promise.all(
        photoItems.map((item) => (item.file ? fileToDataUrl(item.file) : Promise.resolve(item.url)))
      );

      const nextReceipt = {
        vendor,
        amount: Number(amount) || 0,
        vehicleId,
        category,
        date,
        fuelLiters: category === "fuel" ? Number(fuelLiters) || undefined : undefined,
        photos: photoUrls,
      };

      if (initialReceipt) {
        updateReceipt(initialReceipt.id, nextReceipt);
      } else {
        addReceipt(nextReceipt);
      }

      onClose();
    }}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vendor" label="Vendor"><Input id="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Shell Premium" /></Field>
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
        {photoItems.length === 0 && <span className="text-xs text-muted-foreground">You can attach multiple images.</span>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">{isEditing ? "Save changes" : "Save receipt"}</Button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: any) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
