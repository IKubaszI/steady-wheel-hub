import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  ShieldAlert,
  Flame,
  Wrench,
  Compass,
  Tv,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import type { TranslationKey } from "@/lib/translations";

const categories = [
  { id: "documents", nameKey: "proTips.cat.documents" as const, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "bodywork", nameKey: "proTips.cat.bodywork" as const, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "engine", nameKey: "proTips.cat.engine" as const, icon: Flame, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "suspension", nameKey: "proTips.cat.suspension" as const, icon: Wrench, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "testdrive", nameKey: "proTips.cat.testdrive" as const, icon: Compass, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "interior", nameKey: "proTips.cat.interior" as const, icon: Tv, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function ProTips() {
  const { t } = useSettings();
  const { toast } = useToast();
  const { checklist, toggleChecklistItem, addChecklistItem, deleteChecklistItem, resetChecklist } = useGarageData();

  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState("documents");
  const [adding, setAdding] = useState(false);

  const handleToggle = async (id: string, checked: number) => {
    try {
      await toggleChecklistItem(id, checked);
    } catch (err) {
      toast({
        title: t("vehicles.toast.saveFailed"),
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      toast({
        title: t("vehicles.toast.saveFailed"),
        description: t("proTips.emptyCustom"),
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    try {
      await addChecklistItem(newCategory, newText.trim());
      setNewText("");
      toast({
        title: t("common.save"),
        description: t("proTips.addedSuccess"),
      });
    } catch (err) {
      toast({
        title: t("vehicles.toast.saveFailed"),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistItem(id);
      toast({
        title: t("common.delete"),
        description: t("proTips.deletedSuccess"),
      });
    } catch (err) {
      toast({
        title: t("ocr.scanFailed"),
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetChecklist();
      toast({
        title: t("proTips.reset"),
        description: t("proTips.resetSuccess"),
      });
    } catch (err) {
      toast({
        title: t("ocr.scanFailed"),
        description: String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("proTips.title")}
        subtitle={t("proTips.subtitle")}
        action={
          <Button variant="outline" onClick={handleReset} className="gap-2 shrink-0 border-border/80">
            <RotateCcw className="h-4 w-4" />
            {t("proTips.reset")}
          </Button>
        }
      />

      <Tabs defaultValue="checklist" className="space-y-6">
        <TabsList className="flex w-full sm:w-auto h-auto justify-start bg-secondary/40 p-1 rounded-xl">
          <TabsTrigger value="checklist" className="rounded-lg py-2 px-4 font-semibold text-sm">
            {t("proTips.tab.checklist")}
          </TabsTrigger>
          <TabsTrigger value="tips" className="rounded-lg py-2 px-4 font-semibold text-sm">
            {t("proTips.tab.tips")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-6">
          {/* Add custom item form */}
          <form onSubmit={handleAdd} className="surface-card p-5 space-y-4 rounded-2xl border border-border/70">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
              {t("proTips.addCustom")}
            </h3>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="custom-item-text" className="sr-only">
                  {t("proTips.customPlaceholder")}
                </Label>
                <Input
                  id="custom-item-text"
                  placeholder={t("proTips.customPlaceholder")}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  maxLength={160}
                  className="bg-secondary/40 border-transparent focus-visible:bg-card focus-visible:border-border h-11"
                />
              </div>
              <div className="w-full md:w-56 space-y-1.5">
                <Label htmlFor="custom-item-category" className="sr-only">
                  {t("proTips.selectCategory")}
                </Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger id="custom-item-category" className="bg-secondary/40 border-transparent h-11">
                    <SelectValue placeholder={t("proTips.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {t(cat.nameKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={adding} className="gap-2 h-11 px-5 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-all">
                <Plus className="h-4 w-4" />
                {t("common.save")}
              </Button>
            </div>
          </form>

          {/* Categories and Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const catItems = checklist.filter((item) => item.category === cat.id);

              return (
                <div key={cat.id} className="surface-card p-5 rounded-2xl border border-border/70 space-y-4 hover:border-border transition-all">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div className={`h-9 w-9 rounded-xl ${cat.bg} ${cat.color} grid place-items-center`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base leading-tight">
                        {t(cat.nameKey)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {catItems.filter((i) => i.checked === 1).length} / {catItems.length} {t("status.completed").toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[80px]">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggle(item.id, item.checked === 1 ? 0 : 1)}
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-secondary/20 cursor-pointer select-none transition-all group ${
                          item.checked === 1 ? "bg-secondary/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={item.checked === 1}
                            className="mt-0.5 pointer-events-none"
                          />
                          <span
                            className={`text-sm leading-relaxed ${
                              item.checked === 1 ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {item.titleKey ? t(item.titleKey as TranslationKey) : item.text}
                          </span>
                        </div>
                        {(!item.titleKey || item.text) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded"
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {catItems.length === 0 && (
                      <div className="h-20 flex flex-col items-center justify-center text-center text-xs text-muted-foreground/80 space-y-1">
                        <HelpCircle className="h-5 w-5 text-muted-foreground/45" />
                        <span>No items in this category.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <OwnerTipCard
            title="Cykle serwisowe (Maintenance Cycles)"
            desc="Regularna wymiana oleju silnikowego i filtrów co 10-15 tys. km (lub raz w roku) drastycznie wydłuża żywotność silnika, nawet jeśli producent zaleca rzadszą wymianę typu LongLife."
            icon={Wrench}
            tag="Silnik"
          />
          <OwnerTipCard
            title="Kontrola poziomu płynów (Fluid Check)"
            desc="Przynajmniej raz w miesiącu sprawdzaj poziom oleju silnikowego, płynu chłodniczego oraz hamulcowego. Zbyt niski poziom któregoś z nich może doprowadzić do nagłej awarii w trasie."
            icon={Lightbulb}
            tag="Bezpieczeństwo"
          />
          <OwnerTipCard
            title="Sygnały ostrzegawcze (Warning Signs)"
            desc="Nigdy nie ignoruj kontrolek na desce rozdzielczej. Migająca kontrolka 'Check Engine' oznacza konieczność natychmiastowego zgaszenia silnika, aby nie uszkodzić katalizatora lub tłoków."
            icon={ShieldAlert}
            tag="Diagnostyka"
          />
          <OwnerTipCard
            title="Ciśnienie w oponach (Tire Pressure)"
            desc="Zbyt niskie ciśnienie zwiększa zużycie paliwa nawet o 5%, powoduje nierównomierne zużywanie się bieżnika oraz znacznie wydłuża drogę hamowania."
            icon={Compass}
            tag="Opony"
          />
          <OwnerTipCard
            title="Chłodzenie turbiny (Turbo Care)"
            desc="Po dynamicznej jeździe autostradowej nie gaś silnika od razu. Pozwól mu popracować na biegu jałowym przez 1-2 minuty, aby olej schłodził rozgrzaną turbosprężarkę."
            icon={Flame}
            tag="Eksploatacja"
          />
          <OwnerTipCard
            title="Przygotowanie do zimy (Winter Prep)"
            desc="Zanim przyjdą mrozy, sprawdź stan akumulatora. Niska temperatura obniża pojemność rozruchową baterii nawet o 30%, co może uniemożliwić odpalenie o poranku."
            icon={Sparkles}
            tag="Sezon"
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function OwnerTipCard({ title, desc, icon: Icon, tag }: { title: string; desc: string; icon: typeof Wrench; tag: string }) {
  return (
    <div className="surface-card p-5 rounded-2xl border border-border/70 space-y-4 hover:border-border transition-all flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md shrink-0">
            {tag}
          </span>
        </div>
        <h4 className="font-display font-bold text-base">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
