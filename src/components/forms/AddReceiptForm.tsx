import { useState, type ChangeEvent, type ReactNode, useEffect } from "react";
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
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (initialReceipt?.photos ?? []).map((url, index) => ({ id: `existing-${index}`, url }))
  );
  const [busy, setBusy] = useState(false);
  const isEditing = Boolean(initialReceipt);

  const schema = z.object({
    vendor: z.string().trim().min(1, "Vendor required"),
    amount: z.string().trim().refine((v) => Number(v) > 0, { message: "Amount must be greater than 0" }),
    vehicleId: z.string().trim().min(1, "Vehicle required"),
    category: z.enum(["fuel", "parts", "service", "insurance", "other"]).default("fuel"),
    date: z.string().trim().min(1, "Date required"),
    fuelLiters: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendor: initialReceipt?.vendor ?? "",
      amount: initialReceipt?.amount != null ? String(initialReceipt.amount) : "",
      vehicleId: initialReceipt?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? "",
      category: initialReceipt?.category ?? defaultCategory,
      date: initialReceipt?.date ?? new Date().toISOString().slice(0, 10),
      fuelLiters: initialReceipt?.fuelLiters != null ? String(initialReceipt.fuelLiters) : "",
    },
  });

  useEffect(() => {
    if (!control.getValues("vehicleId") && vehicles.length > 0) {
      reset({ ...control.getValues(), vehicleId: vehicles[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

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
    <form className="space-y-4" onSubmit={handleSubmit(async (values) => {
      const existingPhotoUrls = photoItems.filter((item) => !item.file).map((item) => item.url);
      const newFiles = photoItems.filter((item) => item.file).map((item) => item.file as File);
      if (photoItems.length > MAX_RECEIPT_FILES) {
        toast({ title: "Too many files", description: `You can upload up to ${MAX_RECEIPT_FILES} files for one receipt.`, variant: "destructive" });
        return;
      }
      if (newFiles.some((file) => file.size > MAX_RECEIPT_FILE_SIZE_BYTES)) {
        toast({ title: "File too large", description: "One of selected files exceeds 15MB before compression.", variant: "destructive" });
        return;
      }

      const nextReceipt = {
        vendor: values.vendor.trim(),
        amount: Number(values.amount) || 0,
        vehicleId: values.vehicleId,
        category: values.category,
        date: values.date,
        fuelLiters: values.category === "fuel" ? (values.fuelLiters ? Number(values.fuelLiters) : undefined) : undefined,
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
    })}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vendor" label="Vendor">
          <Controller control={control} name="vendor" render={({ field }) => (
            <Input id="vendor" maxLength={160} value={field.value} onChange={field.onChange} placeholder="Shell Premium" />
          )} />
        </Field>
        <Field id="amount" label="Amount ($)">
          <Controller control={control} name="amount" render={({ field }) => (
            <Input id="amount" value={field.value} onChange={field.onChange} type="number" step="0.01" placeholder="62.80" />
          )} />
        </Field>
        <Field id="vehicle" label="Vehicle tag">
          <Controller control={control} name="vehicleId" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="vehicle"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
        <Field id="category" label="Category">
          <Controller control={control} name="category" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="category"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
        <Field id="date" label="Date">
          <Controller control={control} name="date" render={({ field }) => (
            <Input id="date" value={field.value} onChange={field.onChange} type="date" />
          )} />
        </Field>
        <Controller control={control} name="fuelLiters" render={({ field }) => (
          field.value && (
            <Field id="fuelLiters" label="Fuel liters (L)"><Input id="fuelLiters" value={field.value} onChange={field.onChange} type="number" step="0.1" placeholder="31.4" /></Field>
          )
        )} />
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
        <Button type="submit" disabled={vehicles.length === 0 || busy || formState.isSubmitting} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy || formState.isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Save receipt"}
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
