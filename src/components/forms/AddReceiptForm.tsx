import { useState, type ChangeEvent, type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Tesseract.js is imported dynamically inside triggerAutoOCR to avoid
// loading the ~2 MB WASM binary on page load (only needed on user action)
import { recognizeReceiptGemini } from "@/services/visionService";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MAX_RECEIPT_FILES, MAX_RECEIPT_FILE_SIZE_BYTES } from "@/lib/schemas";
import { formatAppError } from "@/lib/errors";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettings } from "@/context/settings";
import { type TranslationKey } from "@/lib/translations";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const { vehicles, addReceipt, updateReceipt, deleteReceipt } = useGarageData();
  const { toast } = useToast();
  const { t, symbol, language, activeGeminiApiKey } = useSettings();
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (initialReceipt?.photos ?? []).map((url, index) => ({ id: `existing-${index}`, url }))
  );
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isEditing = Boolean(initialReceipt);

  const schema = z.object({
    vendor: z.string().trim().min(1, t("validate.vendorRequired")),
    amount: z.string().trim().refine((v) => Number(v) > 0, { message: t("validate.amountPositive") }),
    vehicleId: z.string().trim().min(1, t("validate.vehicleRequired")),
    category: z.enum(["fuel", "parts", "service", "insurance", "other"]).default("fuel"),
    date: z.string().trim().min(1, t("validate.dateRequired")),
    fuelLiters: z.string().optional(),
    description: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit, formState, reset, getValues, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendor: initialReceipt?.vendor ?? "",
      amount: initialReceipt?.amount != null ? String(initialReceipt.amount) : "",
      vehicleId: initialReceipt?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? "",
      category: initialReceipt?.category ?? defaultCategory,
      date: initialReceipt?.date ?? new Date().toISOString().slice(0, 10),
      fuelLiters: initialReceipt?.fuelLiters != null ? String(initialReceipt.fuelLiters) : "",
      description: initialReceipt?.description ?? "",
    },
  });

  const categoryValue = watch("category");

  useEffect(() => {
    if (!getValues("vehicleId") && vehicles.length > 0) {
      reset({ ...getValues(), vehicleId: vehicles[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  const normalizeDateToYYYYMMDD = (rawDate: string): string => {
    if (!rawDate) return "";
    const cleaned = rawDate.trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    
    const matchYYYYMMDD = cleaned.match(/^(\d{4})[^0-9](\d{2})[^0-9](\d{2})$/);
    if (matchYYYYMMDD) {
      return `${matchYYYYMMDD[1]}-${matchYYYYMMDD[2]}-${matchYYYYMMDD[3]}`;
    }
    
    const matchDDMMYYYY = cleaned.match(/^(\d{2})[^0-9](\d{2})[^0-9](\d{4})$/);
    if (matchDDMMYYYY) {
      return `${matchDDMMYYYY[3]}-${matchDDMMYYYY[2]}-${matchDDMMYYYY[1]}`;
    }

    try {
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    } catch {
      // ignore
    }
    
    return "";
  };

  const triggerAutoOCR = async (file: File) => {
    try {
      setOcrLoading(true);
      toast({
        title: t("ocr.scanning"),
        description: t("ocr.scanningDesc"),
      });

      const geminiApiKey = activeGeminiApiKey;
      if (geminiApiKey) {
        console.log("Using Google Gemini API for OCR");
        const parsed = await recognizeReceiptGemini(file, geminiApiKey);
        
        let vendor = parsed.vendor || "";
        const date = normalizeDateToYYYYMMDD(parsed.date || "");
        const amount = parsed.amount != null ? String(parsed.amount) : "";

        if (vendor) {
          vendor = vendor.replace(/^["'\s,]+|["'\s,]+$/g, "").trim();
          setValue("vendor", vendor);
        }
        if (amount) setValue("amount", amount);
        if (date) setValue("date", date);

        toast({
          title: t("ocr.scanCompleteGemini"),
          description: t("ocr.scanCompleteDesc", {
            vendor: vendor || t("common.none"),
            amount: amount || t("common.none"),
            date: date || t("common.none"),
          }),
        });
      } else {
        console.log("No VITE_GEMINI_API_KEY configured. Falling back to local Tesseract.js");
        const { default: Tesseract } = await import("tesseract.js");
        const result = await Tesseract.recognize(file, "pol+eng");
        const text = result.data.text;
        console.log("OCR Result Text:\n", text);

        // Parsing logic
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        
        // 1. Vendor
        let vendor = "";
        const noiseKeywords = ["paragon", "faktura", "sklep", "nip", "tel", "adres", "kasjer", "kasa", "data", "sprzedawca", "odbiorca", "nr", "oryginał", "kopia", "f/"];
        const companyKeywords = ["s.c.", "s.a.", "sp. z o.o.", "sp. j.", "sp. k.", "spółka", "corp", "inc", "llc", "gmbh", "orlen", "shell", "bp", "lotos", "circle k", "autozone", "inter cars", "castorama", "leroy", "skoda", "toyota", "bmw", "ford", "dealers"];
        
        for (const line of lines.slice(0, 12)) {
          const lower = line.toLowerCase();
          
          if (noiseKeywords.some((keyword) => lower.includes(keyword)) && !companyKeywords.some((kw) => lower.includes(kw))) {
            continue;
          }

          if (companyKeywords.some((kw) => lower.includes(kw)) && line.length > 3 && line.length < 60) {
            const buyerIndex = lower.indexOf("nabywca");
            const janIndex = lower.indexOf("jan ");
            const splitIndex = buyerIndex !== -1 ? buyerIndex : janIndex !== -1 ? janIndex : -1;
            
            vendor = splitIndex !== -1 ? line.slice(0, splitIndex).trim() : line;
            break;
          }
        }

        if (!vendor) {
          for (const line of lines.slice(0, 8)) {
            const matchQuoted = line.match(/"([^"]+)"/);
            if (matchQuoted && matchQuoted[1].length > 2 && matchQuoted[1].length < 40) {
              vendor = matchQuoted[0];
              break;
            }
          }
        }

        if (!vendor) {
          for (const line of lines.slice(0, 5)) {
            const lower = line.toLowerCase();
            if (!noiseKeywords.some((keyword) => lower.includes(keyword)) && line.length > 2 && line.length < 40) {
              vendor = line;
              break;
            }
          }
        }

        // 2. Date: YYYY-MM-DD or DD-MM-YYYY (with any non-digit separator)
        let date = "";
        const dateRegex1 = /\b(\d{4})[^0-9\s](\d{2})[^0-9\s](\d{2})\b/; // YYYY-MM-DD
        const dateRegex2 = /\b(\d{2})[^0-9\s](\d{2})[^0-9\s](\d{4})\b/; // DD-MM-YYYY
        
        for (const line of lines) {
          const match1 = line.match(dateRegex1);
          if (match1) {
            date = `${match1[1]}-${match1[2]}-${match1[3]}`;
            break;
          }
          const match2 = line.match(dateRegex2);
          if (match2) {
            date = `${match2[3]}-${match2[2]}-${match2[1]}`;
            break;
          }
        }

        // 3. Amount: find all prices (with optional space as thousands separator) and pick the maximum
        let amount = "";
        const priceRegex = /\b\d+(?:\s?\d{3})*[.,]\d{2}\b/g;
        const priceMatches: number[] = [];
        
        for (const line of lines) {
          const matches = line.match(priceRegex);
          if (matches) {
            matches.forEach((m) => {
              const val = parseFloat(m.replace(/\s/g, "").replace(",", "."));
              if (!isNaN(val)) {
                priceMatches.push(val);
              }
            });
          }
        }

        if (priceMatches.length > 0) {
          amount = Math.max(...priceMatches).toFixed(2);
        }

        if (vendor) {
          vendor = vendor.replace(/^["'\s,]+|["'\s,]+$/g, "").trim();
          setValue("vendor", vendor);
        }
        if (amount) setValue("amount", amount);
        if (date) setValue("date", date);

        toast({
          title: t("ocr.scanComplete"),
          description: t("ocr.scanCompleteDesc", {
            vendor: vendor || t("common.none"),
            amount: amount || t("common.none"),
            date: date || t("common.none"),
          }),
        });
      }
    } catch (err) {
      console.error("Auto OCR failed:", err);
      toast({
        title: t("ocr.scanFailed"),
        description: t("ocr.scanFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

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

  const [ocrLoading, setOcrLoading] = useState(false);

  const handleOCRScan = async () => {
    const firstNewPhoto = photoItems.find((item) => item.file);
    if (!firstNewPhoto || !firstNewPhoto.file) {
      toast({
        title: t("validate.noPhotoScan"),
        description: t("validate.noPhotoScanDesc"),
        variant: "destructive",
      });
      return;
    }
    triggerAutoOCR(firstNewPhoto.file);
  };

  const handleDeleteReceipt = () => {
    setDeleteConfirm(true);
  };

  const confirmDeleteReceipt = async () => {
    if (!initialReceipt) return;
    try {
      setBusy(true);
      await deleteReceipt(initialReceipt.id);
      toast({ title: t("common.delete"), description: t("activity.receiptToastDeleted") });
      onClose();
    } catch (error) {
      const message = formatAppError(error, "Could not delete receipt.");
      toast({ title: t("receipt.toast.saveFailed"), description: message, variant: "destructive" });
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (values) => {
      const existingPhotoUrls = photoItems.filter((item) => !item.file).map((item) => item.url);
      const newFiles = photoItems.filter((item) => item.file).map((item) => item.file as File);
      if (photoItems.length > MAX_RECEIPT_FILES) {
        toast({ title: t("validate.tooManyFiles"), description: t("validate.tooManyFilesDesc", { max: MAX_RECEIPT_FILES }), variant: "destructive" });
        return;
      }
      if (newFiles.some((file) => file.size > MAX_RECEIPT_FILE_SIZE_BYTES)) {
        toast({ title: t("validate.fileTooLarge"), description: t("validate.fileTooLargeDesc"), variant: "destructive" });
        return;
      }

      const nextReceipt = {
        vendor: values.vendor.trim(),
        amount: Number(values.amount) || 0,
        vehicleId: values.vehicleId,
        category: values.category,
        date: values.date,
        fuelLiters: values.category === "fuel" ? (values.fuelLiters ? Number(values.fuelLiters) : undefined) : undefined,
        description: values.description?.trim() || undefined,
        photos: existingPhotoUrls,
      };

      try {
        setBusy(true);
        if (initialReceipt) {
          await updateReceipt(initialReceipt.id, nextReceipt, newFiles);
          toast({ title: t("receipt.toast.updated"), description: t("receipt.toast.updatedDesc") });
        } else {
          await addReceipt(nextReceipt, newFiles);
          toast({ title: t("receipt.toast.added"), description: t("receipt.toast.addedDesc") });
        }
        onClose();
      } catch (error) {
        const message = formatAppError(error, "Could not save receipt.");
        toast({ title: t("receipt.toast.saveFailed"), description: message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    })}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="vendor" label={t("form.receipt.vendor")}>
          <Controller control={control} name="vendor" render={({ field }) => (
            <Input id="vendor" maxLength={160} value={field.value} onChange={field.onChange} />
          )} />
          {formState.errors.vendor && (
            <p className="text-xs text-destructive mt-1">{formState.errors.vendor.message}</p>
          )}
        </Field>
        <Field id="amount" label={`${t("form.receipt.amount")} (${symbol})`}>
          <Controller control={control} name="amount" render={({ field }) => (
            <Input id="amount" value={field.value} onChange={field.onChange} type="number" step="0.01" />
          )} />
          {formState.errors.amount && (
            <p className="text-xs text-destructive mt-1">{formState.errors.amount.message}</p>
          )}
        </Field>
        <Field id="vehicle" label={t("form.receipt.vehicleTag")}>
          <Controller control={control} name="vehicleId" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="vehicle"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
              <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
        <Field id="category" label={t("form.receipt.category")}>
          <Controller control={control} name="category" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="category"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryMeta).map(([k]) => <SelectItem key={k} value={k}>{t(`category.${k}` as TranslationKey)}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
        <Field id="date" label={t("form.receipt.date")}>
          <Controller control={control} name="date" render={({ field }) => (
            <Input id="date" value={field.value} onChange={field.onChange} type="date" />
          )} />
        </Field>
        {categoryValue === "fuel" && (
          <Field id="fuelLiters" label={`${t("form.receipt.fuelLiters")} (l)`}>
            <Controller control={control} name="fuelLiters" render={({ field }) => (
              <Input id="fuelLiters" value={field.value} onChange={field.onChange} type="number" step="0.1" />
            )} />
            {formState.errors.fuelLiters && (
              <p className="text-xs text-destructive mt-1">{formState.errors.fuelLiters.message}</p>
            )}
          </Field>
        )}
        <div className="col-span-2">
          <Field id="description" label={t("form.receipt.description") || "Krótki opis"}>
            <Controller control={control} name="description" render={({ field }) => (
              <Input id="description" maxLength={500} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photos" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("form.receipt.photos")}</Label>
        <div className="flex gap-2 items-center">
          <Input id="photos" type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="flex-1" />
          {photoItems.some((item) => item.file) && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleOCRScan}
              disabled={ocrLoading}
              className="shrink-0 gap-1.5"
            >
              {ocrLoading ? t("form.receipt.scanning") : `🔍 ${t("form.receipt.autofill")}`}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {photoItems.map((item, index) => (
            <div key={item.id} className="relative group">
              <div className="aspect-[3/4] w-full rounded-lg border border-border bg-secondary/40 overflow-hidden">
                <img src={item.url} alt={`Preview ${index + 1}`} className="h-full w-full object-contain p-1" />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(item.id)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {photoItems.length === 0 && (
          <span className="text-xs text-muted-foreground">
            {t("form.receipt.limit", { max: MAX_RECEIPT_FILES })}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/40">
        {isEditing ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteReceipt}
            disabled={busy}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> {t("activity.deleteReceipt")}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
          <Button type="submit" disabled={vehicles.length === 0 || busy || formState.isSubmitting} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            {busy || formState.isSubmitting ? t("common.saving") : isEditing ? t("form.saveChanges") : t("dashboard.addReceipt")}
          </Button>
        </div>
      </div>
      {vehicles.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {t("form.receipt.addFirstVehicle")}
        </p>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("activity.deleteConfirmTitle", { item: t("nav.receipts").toLowerCase() })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("activity.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReceipt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (<div className="space-y-1.5"><Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}
