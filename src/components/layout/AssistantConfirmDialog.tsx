import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { type Category, type ServiceStatus } from "@/data/mockData";
import { categoryMeta } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { type TranslationKey } from "@/lib/translations";
import Tesseract from "tesseract.js";
import { recognizeReceiptGemini } from "@/services/visionService";
import { X } from "lucide-react";
import { MAX_RECEIPT_FILES, MAX_RECEIPT_FILE_SIZE_BYTES } from "@/lib/schemas";
import { type ParsedAssistantCommand } from "@/services/assistantService";

interface PhotoItem {
  id: string;
  url: string;
  file?: File;
}

export interface AssistantConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedData: {
    type: "receipt" | "maintenance";
    data: {
      vehicleId?: string | null;
      vendor?: string;
      category?: Category;
      amount?: number;
      date?: string;
      fuelLiters?: number;
      type?: string;
      cost?: number;
      status?: ServiceStatus;
      notes?: string;
    };
  } | null;
  onSaveSuccess: () => void;
}

export function AssistantConfirmDialog({
  open,
  onOpenChange,
  parsedData,
  onSaveSuccess,
}: AssistantConfirmDialogProps) {
  const { vehicles, addReceipt, addMaintenance } = useGarageData();
  const { t, symbol } = useSettings();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);

  // Form states
  const [type, setType] = useState<"receipt" | "maintenance">("receipt");
  const [vehicleId, setVehicleId] = useState("");
  
  // Receipt fields
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [fuelLiters, setFuelLiters] = useState("");
  const [description, setDescription] = useState("");

  // Maintenance fields
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("upcoming");
  const [notes, setNotes] = useState("");

  // Photo states & scanner states
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Clear photos when modal is opened/closed
  useEffect(() => {
    if (open) {
      setPhotoItems([]);
    }
  }, [open]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiApiKey) {
        console.log("Using Google Gemini API for OCR");
        const parsed = await recognizeReceiptGemini(file, geminiApiKey);
        
        let vendorVal = parsed.vendor || "";
        const dateVal = normalizeDateToYYYYMMDD(parsed.date || "");
        const amountVal = parsed.amount != null ? String(parsed.amount) : "";

        if (vendorVal) {
          vendorVal = vendorVal.replace(/^["'\s,]+|["'\s,]+$/g, "").trim();
          setVendor(vendorVal);
        }
        if (amountVal) setAmount(amountVal);
        if (dateVal) setDate(dateVal);

        toast({
          title: t("ocr.scanCompleteGemini"),
          description: t("ocr.scanCompleteDesc", {
            vendor: vendorVal || t("common.none"),
            amount: amountVal || t("common.none"),
            date: dateVal || t("common.none"),
          }),
        });
      } else {
        console.log("No VITE_GEMINI_API_KEY configured. Falling back to local Tesseract.js");
        const result = await Tesseract.recognize(file, "pol+eng");
        const text = result.data.text;
        console.log("OCR Result Text:\n", text);

        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        
        let vendorVal = "";
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
            vendorVal = splitIndex !== -1 ? line.slice(0, splitIndex).trim() : line;
            break;
          }
        }

        if (!vendorVal) {
          for (const line of lines.slice(0, 8)) {
            const matchQuoted = line.match(/"([^"]+)"/);
            if (matchQuoted && matchQuoted[1].length > 2 && matchQuoted[1].length < 40) {
              vendorVal = matchQuoted[0];
              break;
            }
          }
        }

        if (!vendorVal) {
          for (const line of lines.slice(0, 5)) {
            const lower = line.toLowerCase();
            if (!noiseKeywords.some((keyword) => lower.includes(keyword)) && line.length > 2 && line.length < 40) {
              vendorVal = line;
              break;
            }
          }
        }

        let dateVal = "";
        const dateRegex1 = /\b(\d{4})[^0-9\s](\d{2})[^0-9\s](\d{2})\b/;
        const dateRegex2 = /\b(\d{2})[^0-9\s](\d{2})[^0-9\s](\d{4})\b/;
        for (const line of lines) {
          const match1 = line.match(dateRegex1);
          if (match1) {
            dateVal = `${match1[1]}-${match1[2]}-${match1[3]}`;
            break;
          }
          const match2 = line.match(dateRegex2);
          if (match2) {
            dateVal = `${match2[3]}-${match2[2]}-${match2[1]}`;
            break;
          }
        }

        let amountVal = "";
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
          amountVal = Math.max(...priceMatches).toFixed(2);
        }

        if (vendorVal) {
          vendorVal = vendorVal.replace(/^["'\s,]+|["'\s,]+$/g, "").trim();
          setVendor(vendorVal);
        }
        if (amountVal) setAmount(amountVal);
        if (dateVal) setDate(dateVal);

        toast({
          title: t("ocr.scanComplete"),
          description: t("ocr.scanCompleteDesc", {
            vendor: vendorVal || t("common.none"),
            amount: amountVal || t("common.none"),
            date: dateVal || t("common.none"),
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

  // Populate states when parsedData changes
  useEffect(() => {
    if (!parsedData) return;

    const commandType = parsedData.type || "receipt";
    const data = parsedData.data || (parsedData as unknown as ParsedAssistantCommand["data"]) || {};
    setType(commandType);

    // Find matched vehicle or default to first vehicle
    const matchedVehicle = vehicles.find((v) => v.id === data.vehicleId) || vehicles[0];
    setVehicleId(matchedVehicle?.id ?? "");

    if (commandType === "receipt") {
      setVendor(data.vendor || "");
      
      const parsedCat = data.category;
      const validCategories: Category[] = ["fuel", "parts", "service", "insurance", "other"];
      if (parsedCat && validCategories.includes(parsedCat as Category)) {
        setCategory(parsedCat as Category);
      } else {
        setCategory("fuel");
      }

      setAmount(data.amount != null ? String(data.amount) : "");
      setDate(data.date || new Date().toISOString().slice(0, 10));
      setFuelLiters(data.fuelLiters != null ? String(data.fuelLiters) : "");
      setDescription(data.description || "");
    } else {
      setServiceType(data.type || "");
      setCost(data.cost != null ? String(data.cost) : "0");

      const parsedStatus = data.status;
      const validStatuses: ServiceStatus[] = ["completed", "upcoming", "overdue"];
      if (parsedStatus && validStatuses.includes(parsedStatus as ServiceStatus)) {
        setStatus(parsedStatus as ServiceStatus);
      } else {
        setStatus("upcoming");
      }

      setDate(data.date || new Date().toISOString().slice(0, 10));
      setNotes(data.notes || "");
    }
  }, [parsedData, vehicles]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast({
        title: t("validate.vehicleRequired"),
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      if (type === "receipt") {
        if (!vendor.trim()) {
          toast({
            title: t("validate.vendorRequired"),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }
        if (Number(amount) <= 0 || isNaN(Number(amount))) {
          toast({
            title: t("validate.amountPositive"),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }

        const newFiles = photoItems.filter((item) => item.file).map((item) => item.file as File);
        if (photoItems.length > MAX_RECEIPT_FILES) {
          toast({
            title: t("validate.tooManyFiles"),
            description: t("validate.tooManyFilesDesc", { max: MAX_RECEIPT_FILES }),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }
        if (newFiles.some((file) => file.size > MAX_RECEIPT_FILE_SIZE_BYTES)) {
          toast({
            title: t("validate.fileTooLarge"),
            description: t("validate.fileTooLargeDesc"),
            variant: "destructive",
          });
          setBusy(false);
          return;
        }

        await addReceipt({
          vehicleId,
          vendor: vendor.trim(),
          category,
          amount: Number(amount),
          date,
          fuelLiters: category === "fuel" && fuelLiters ? Number(fuelLiters) : undefined,
          description: description.trim() || undefined,
          photos: [],
        }, newFiles);

        toast({
          title: t("receipt.toast.added"),
          description: t("receipt.toast.addedDesc"),
        });
      } else {
        if (!serviceType.trim()) {
          toast({
            title: t("form.service.type") + " required",
            variant: "destructive",
          });
          setBusy(false);
          return;
        }

        await addMaintenance({
          vehicleId,
          type: serviceType.trim(),
          date,
          cost: Number(cost) || 0,
          status,
          notes: notes.trim(),
        });

        toast({
          title: t("maintenance.toast.added"),
          description: t("maintenance.toast.addedDesc"),
        });
      }

      onSaveSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = formatAppError(err, "Could not save entry.");
      toast({
        title: type === "receipt" ? t("receipt.toast.saveFailed") : t("maintenance.toast.saveFailed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border border-border/80 bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            {t("assistant.confirm.title")}
          </DialogTitle>
          <DialogDescription>
            {t("assistant.confirm.desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          {/* Shared Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("assistant.confirm.type")}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "receipt" ? "default" : "outline"}
                  onClick={() => setType("receipt")}
                  className="flex-1 text-xs"
                >
                  {t("assistant.btn.receipt")}
                </Button>
                <Button
                  type="button"
                  variant={type === "maintenance" ? "default" : "outline"}
                  onClick={() => setType("maintenance")}
                  className="flex-1 text-xs"
                >
                  {t("assistant.btn.maintenance")}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="assistant-vehicle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("common.vehicle")}
              </Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="assistant-vehicle">
                  <SelectValue placeholder={t("vehicles.selectVehicle")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} · {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Form Fields */}
          {type === "receipt" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assistant-vendor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.vendor")}
                </Label>
                <Input
                  id="assistant-vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.amount")} ({symbol})
                </Label>
                <Input
                  id="assistant-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.category")}
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as Category)}
                >
                  <SelectTrigger id="assistant-category">
                    <SelectValue placeholder={t("common.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryMeta).map(([k, m]) => (
                      <SelectItem key={k} value={k}>
                        {t(`category.${k}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.date")}
                </Label>
                <Input
                  id="assistant-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {category === "fuel" && (
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="assistant-liters" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("form.receipt.fuelLiters")} (l)
                  </Label>
                  <Input
                    id="assistant-liters"
                    type="number"
                    step="0.1"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                  />
                </div>
              )}

              {/* Photo Upload & OCR section */}
              <div className="space-y-1.5 col-span-2 mt-2">
                <Label htmlFor="assistant-photos" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.receipt.photos")}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="assistant-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="flex-1 text-xs"
                  />
                  {photoItems.some((item) => item.file) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleOCRScan}
                      disabled={ocrLoading}
                      className="shrink-0 gap-1.5 text-xs h-9"
                    >
                      {ocrLoading ? t("form.receipt.scanning") : `🔍 ${t("form.receipt.autofill")}`}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
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
                  <span className="text-[10px] text-muted-foreground block">
                    {t("form.receipt.limit", { max: MAX_RECEIPT_FILES })}
                  </span>
                )}
              </div>

              {/* Description field */}
              <div className="space-y-1.5 col-span-2 mt-2">
                <Label htmlFor="assistant-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.receipt.description") || "Krótki opis"}
                </Label>
                <Input
                  id="assistant-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-service-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.type")}
                </Label>
                <Input
                  id="assistant-service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder={t("form.service.typePlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-cost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.cost")} ({symbol})
                </Label>
                <Input
                  id="assistant-cost"
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assistant-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.status")}
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as ServiceStatus)}
                >
                  <SelectTrigger id="assistant-status">
                    <SelectValue placeholder={t("maintenance.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
                    <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
                    <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.date")}
                </Label>
                <Input
                  id="assistant-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="assistant-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("form.service.notes")}
                </Label>
                <Textarea
                  id="assistant-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("form.service.notesPlaceholder")}
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={busy || vehicles.length === 0}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            >
              {busy ? t("common.saving") : t("assistant.confirm.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
