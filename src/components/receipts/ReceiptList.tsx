import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Filter, Search, Camera, Pencil, ChevronDown, Image as ImageIcon, Download, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { categoryMeta, type Category } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { type TranslationKey } from "@/lib/translations";

const categories: (Category | "all")[] = ["all", "fuel", "parts", "service", "insurance", "other"];

type Props = {
  onAddReceipt?: (category: Category) => void;
  onEditReceipt?: (receiptId: string) => void;
};

export function ReceiptList({ onAddReceipt, onEditReceipt }: Props) {
  const { receipts, vehicles, deleteReceipt } = useGarageData();
  const { toast } = useToast();
  const { format: fmtMoney, t, language, currency, symbol } = useSettings();

  const handleDeleteReceipt = async (id: string) => {
    const confirmMsg = t("activity.deleteConfirmTitle", {
      item: t("nav.receipts").toLowerCase(),
    });
    if (window.confirm(confirmMsg)) {
      try {
        await deleteReceipt(id);
        toast({ title: t("common.delete"), description: t("activity.receiptToastDeleted") });
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("ocr.scanFailedDesc"),
          variant: "destructive",
        });
      }
    }
  };
  const [cat, setCat] = useState<Category | "all">("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ src: string; name: string } | null>(null);

  const filtered = useMemo(
    () => receipts
      .filter((receipt) => cat === "all" || receipt.category === cat)
      .filter((receipt) => filterVehicle === "all" || receipt.vehicleId === filterVehicle)
      .filter((receipt) => receipt.vendor.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +parseISO(b.date) - +parseISO(a.date)),
    [cat, filterVehicle, q, receipts]
  );

  const total = filtered.reduce((sum, receipt) => sum + receipt.amount, 0);
  const fuelLiters = filtered.filter((receipt) => receipt.category === "fuel").reduce((sum, receipt) => sum + (receipt.fuelLiters ?? 0), 0);
  const activeFilters = cat !== "all" || filterVehicle !== "all" || q !== "";

  const handleExportCSV = () => {
    const escapeCSV = (val: unknown) => {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDecimal = (num: number, precision: number) => {
      const str = num.toFixed(precision);
      return language === "pl" ? str.replace(".", ",") : str;
    };

    const headers = [
      t("csv.vendor"),
      t("csv.vehicle"),
      t("csv.plate"),
      t("csv.category"),
      t("csv.date"),
      t("csv.amount", { currency }),
      t("csv.fuelLiters"),
    ];

    const rows = filtered.map((receipt) => {
      const vehicle = vehicles.find((v) => v.id === receipt.vehicleId);
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : t("photos.unknownVehicle");
      const vehiclePlate = vehicle ? vehicle.plate : "";
      const categoryLabel = t(`category.${receipt.category}` as TranslationKey);
      return [
        receipt.vendor,
        vehicleName,
        vehiclePlate,
        categoryLabel,
        receipt.date,
        formatDecimal(receipt.amount, 2),
        receipt.fuelLiters != null ? formatDecimal(receipt.fuelLiters, 1) : "",
      ].map(escapeCSV).join(";");
    });

    const summaryLines = [
      "",
      "===========================================================;;;;;;",
      `${t("csv.summaryTitle")};;;;;;`,
      `${t("csv.txCount")};;;;;${filtered.length};`,
      `${t("csv.totalAmount")};;;;;${formatDecimal(total, 2)} ${currency};`,
      cat === "fuel" || fuelLiters > 0 ? `${t("csv.totalFuel")};;;;;;${formatDecimal(fuelLiters, 1)}` : "",
      "===========================================================;;;;;;",
    ].filter(Boolean);

    const csvContent = [
      "sep=;",
      headers.join(";"),
      ...rows,
      ...summaryLines
    ].join("\n");

    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filePrefix = language === "pl" ? "zestawienie_wydatkow" : "expense_summary";
    link.setAttribute("href", url);
    link.setAttribute("download", `${filePrefix}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="surface-card p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.category")}</p>
          <h3 className="font-display text-lg font-semibold mt-1">
            {cat === "all" ? t("receipts.allReceipts") : t("receipts.categoryReceipts", { category: t(`category.${cat}` as TranslationKey) })}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {cat === "fuel"
              ? t("receipts.desc.fuel")
              : cat === "parts"
                ? t("receipts.desc.parts")
                : t("receipts.desc.default")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" /> {t("receipts.exportCsv")}
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/receipt-photos"><Camera className="h-4 w-4" /> {t("receipts.receiptPhotos")}</Link>
          </Button>
          {cat !== "all" && onAddReceipt && (
            <Button onClick={() => onAddReceipt(cat)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              {t(`receipts.add${cat.charAt(0).toUpperCase() + cat.slice(1)}Receipt` as TranslationKey)}
            </Button>
          )}
        </div>
      </div>

      <div className="surface-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("receipts.filterBy")}</p>
          {activeFilters && (
            <Button variant="ghost" size="sm" onClick={() => {
              setCat("all");
              setFilterVehicle("all");
              setQ("");
            }}>
              {t("photos.clearFilters")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-2">{t("common.category")}</label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={cat === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setCat("all")}
                >
                  {t("photos.allCategories")}
                </Badge>
                {categories.filter((c) => c !== "all").map((category) => {
                  const meta = categoryMeta[category as Category];
                  const active = cat === category;
                  return (
                    <Badge 
                      key={category}
                      variant={active ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer",
                        !active && meta ? meta.bg : ""
                      )}
                      onClick={() => setCat(category as Category)}
                    >
                      {meta && <meta.icon className="inline h-3 w-3 mr-1 -mt-0.5" />}
                      {t(`category.${category}` as TranslationKey)}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">{t("common.vehicle")}</label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={filterVehicle === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterVehicle("all")}
                >
                  {t("photos.allVehicles")}
                </Badge>
                {vehicles.map((v) => (
                  <Badge 
                    key={v.id}
                    variant={filterVehicle === v.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilterVehicle(v.id)}
                  >
                    {v.brand} {v.model}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">{t("receipts.searchVendor")}</label>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder={t("receipts.searchVendor")} className="pl-9 h-9 bg-secondary/60 border-transparent w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {filtered.length === 1 ? t("nav.results", { count: 1 }) : t("nav.resultsPlural", { count: filtered.length })}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{t("vehicles.totalSpend")}: <span className="font-display font-bold text-lg">{fmtMoney(total)}</span></span>
          {cat === "fuel" && <Badge variant="secondary" className="rounded-full">{fuelLiters.toFixed(1)} L</Badge>}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_100px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-secondary/40">
          <span>{t("common.vendor")}</span><span>{t("common.vehicle")}</span><span>{t("common.category")}</span><span>{t("common.date")}</span><span className="text-right">{t("common.amount")}</span>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((receipt) => {
            const vehicle = vehicles.find((entry) => entry.id === receipt.vehicleId)!;
            const meta = categoryMeta[receipt.category];
            const Icon = meta.icon;
            const isOpen = expanded === receipt.id;
            return (
              <li key={receipt.id} className={cn("transition-colors", isOpen ? "bg-secondary/50" : "hover:bg-secondary/40") }>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : receipt.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left grid grid-cols-1 md:grid-cols-[1fr_140px_140px_120px_100px] gap-x-4 gap-y-2 px-5 py-4 focus-visible:outline-none focus-visible:bg-secondary/60"
                >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                  <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0", meta.bg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate flex items-center gap-2">
                      {receipt.vendor}
                      {receipt.photos.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />{receipt.photos.length}
                        </span>
                      )}
                    </p>
                    <div className="md:hidden flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{vehicle.brand} {vehicle.model}</span>
                      <span>·</span>
                      <span>{format(parseISO(receipt.date), "MMM d")}</span>
                      {receipt.fuelLiters != null && (
                        <span>· {language === "pl" ? receipt.fuelLiters.toFixed(1).replace(".", ",") : receipt.fuelLiters.toFixed(1)} L</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center self-center">
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">{vehicle.brand} {vehicle.model}</Badge>
                </div>
                <div className="hidden md:flex items-center self-center">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold capitalize", meta.bg)}>
                    <Icon className="h-3 w-3" /> {t(`category.${receipt.category}` as TranslationKey)}
                  </span>
                </div>
                <p className="hidden md:block text-sm self-center tabular-nums">{format(parseISO(receipt.date), language === "pl" ? "yyyy-MM-dd" : "MMM d, yyyy")}</p>
                <div className="md:text-right self-center">
                  <p className="font-display font-bold tabular-nums">{fmtMoney(receipt.amount)}</p>
                  {receipt.fuelLiters != null && (
                    <p className="text-xs text-muted-foreground">
                      {language === "pl" ? receipt.fuelLiters.toFixed(1).replace(".", ",") : receipt.fuelLiters.toFixed(1)} L
                    </p>
                  )}
                </div>
                </button>
                <Collapsible open={isOpen}>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="px-5 pb-5 -mt-1">
                      <div className="rounded-xl border border-border/70 bg-card p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <Detail label={t("common.vendor")} value={receipt.vendor} />
                          <Detail label={t("common.category")} value={t(`category.${receipt.category}` as TranslationKey)} />
                          <Detail label={t("common.vehicle")} value={`${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`} />
                          <Detail label={t("common.date")} value={format(parseISO(receipt.date), language === "pl" ? "yyyy-MM-dd" : "MMMM d, yyyy")} />
                          <Detail label={t("common.amount")} value={fmtMoney(receipt.amount)} />
                          {receipt.fuelLiters != null && (
                            <Detail
                              label={t("form.receipt.fuelLiters")}
                              value={`${language === "pl" ? receipt.fuelLiters.toFixed(1).replace(".", ",") : receipt.fuelLiters.toFixed(1)} L`}
                            />
                          )}
                          {receipt.description && (
                            <div className="col-span-2 mt-1 border-t border-border/40 pt-2">
                              <Detail label={t("form.receipt.description") || "Krótki opis"} value={receipt.description} />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {onEditReceipt && (
                            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => onEditReceipt(receipt.id)}>
                              <Pencil className="h-3.5 w-3.5" /> {t("receipts.edit")}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                            onClick={() => handleDeleteReceipt(receipt.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
                          </Button>
                        </div>
                      </div>
                      {receipt.photos.length > 0 ? (
                        <div className="flex gap-2 flex-wrap md:flex-nowrap md:max-w-xs">
                          {receipt.photos.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreview({ src, name: `${receipt.vendor.replace(/\s+/g, "-").toLowerCase()}-${i + 1}.jpg` })}
                              className="block h-24 w-24 rounded-lg overflow-hidden border border-border hover:scale-105 transition-transform cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Preview ${receipt.vendor} receipt ${i + 1}`}
                            >
                              <img src={src} alt={`${receipt.vendor} receipt ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="self-start text-xs text-muted-foreground italic">{t("receipts.noPhotos")}</div>
                      )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="p-10 text-center text-muted-foreground text-sm">{t("receipts.noReceiptsMatch")}</li>
          )}
        </ul>
      </div>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b border-border flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="min-w-0">
              <DialogTitle className="text-base truncate">{t("receipts.preview")}</DialogTitle>
              <DialogDescription className="truncate">{preview?.name}</DialogDescription>
            </div>
            {preview && (
              <a
                href={preview.src}
                download={preview.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-primary text-primary-foreground px-3 py-1.5 text-sm font-medium shadow-glow hover:opacity-90"
              >
                <Download className="h-4 w-4" /> {t("receipts.download")}
              </a>
            )}
          </DialogHeader>
          {preview && (
            <div className="bg-secondary/40 grid place-items-center max-h-[75vh]">
              <img src={preview.src} alt="Receipt preview" className="max-h-[75vh] w-auto object-contain animate-fade-in" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}
