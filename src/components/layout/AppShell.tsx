import { useMemo, useState, type MouseEventHandler } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Car, Wrench, Receipt, BarChart3, Search, Menu, X, Plus, Settings, Sparkles, Camera, LogOut, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useGarageData } from "@/context/garage-data";
import { useAuth } from "@/context/auth";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsPopover } from "./NotificationsPopover";
import { AccountSettingsDialog } from "./AccountSettingsDialog";
import { AccessibilityWidget } from "./AccessibilityWidget";
import { useSettings } from "@/context/settings";
import { AssistantChatWidget } from "./AssistantChatWidget";
import { AssistantConfirmDialog } from "./AssistantConfirmDialog";
import { type ParsedAssistantCommand } from "@/services/assistantService";
import { type TranslationKey } from "@/lib/translations";

export function AppShell({ children, onQuickAdd }: { children: React.ReactNode; onQuickAdd?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedAssistantCommand | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicles, receipts, maintenance } = useGarageData();
  const { user, logout } = useAuth();
  const { t, format: fmtMoney } = useSettings();

  const navItems = useMemo(() => [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/vehicles", label: t("nav.vehicles"), icon: Car },
    { to: "/maintenance", label: t("nav.maintenance"), icon: Wrench },
    { to: "/receipts", label: t("nav.receipts"), icon: Receipt },
    { to: "/receipt-photos", label: t("nav.receiptPhotos"), icon: Camera },
    { to: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
  ], [t]);

  const displayName = user?.displayName?.trim() || user?.email?.split("@")[0] || t("dashboard.driver");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const vehicleMatches = vehicles
      .filter((vehicle) => [vehicle.brand, vehicle.model, vehicle.plate, vehicle.color].join(" ").toLowerCase().includes(query))
      .map((vehicle) => ({
        kind: "vehicle" as const,
        title: `${vehicle.brand} ${vehicle.model}`,
        subtitle: vehicle.plate,
        to: "/vehicles",
      }));

    const receiptMatches = receipts
      .filter((receipt) => [receipt.vendor, t(`category.${receipt.category}` as TranslationKey), receipt.date].join(" ").toLowerCase().includes(query))
      .map((receipt) => ({
        kind: "receipt" as const,
        title: receipt.vendor,
        subtitle: `${t(`category.${receipt.category}` as TranslationKey)} · ${fmtMoney(receipt.amount)}`,
        to: "/receipts",
      }));

    const serviceMatches = maintenance
      .filter((entry) => [entry.type, entry.notes, t(`status.${entry.status}` as TranslationKey)].join(" ").toLowerCase().includes(query))
      .map((entry) => ({
        kind: "service" as const,
        title: entry.type,
        subtitle: `${t(`status.${entry.status}` as TranslationKey)} · ${fmtMoney(entry.cost)}`,
        to: "/maintenance",
      }));

    return [...vehicleMatches, ...receiptMatches, ...serviceMatches].slice(0, 6);
  }, [maintenance, receipts, searchQuery, vehicles, t, fmtMoney]);

  const handleSearchSubmit = () => {
    if (searchResults[0]) {
      navigate(searchResults[0].to);
      setSearchQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Sidebar — desktop */}
      <aside aria-label="Primary navigation" className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-30">
        <Brand />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <UpsellCard />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col animate-slide-in-left shadow-elev-lg">
            <div className="flex items-center justify-between px-5 pt-5">
              <Brand compact />
              <Button variant="ghost" size="icon" aria-label="Close navigation menu" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <SidebarLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <UpsellCard />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center gap-3 h-16 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("nav.searchPlaceholder")}
                className="pl-9 h-10 bg-secondary/60 border-transparent focus-visible:bg-card focus-visible:border-border"
                aria-label="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              {searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-border bg-card shadow-elev-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {searchResults.length === 1
                      ? t("nav.results", { count: 1 })
                      : t("nav.resultsPlural", { count: searchResults.length })}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.kind}-${index}`}
                        onClick={() => {
                          navigate(result.to);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-secondary/70 flex items-start gap-3"
                      >
                        <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-bold uppercase">
                          {result.kind.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                      </button>
                    ))}
                    {searchResults.length === 0 && (
                      <div className="px-4 py-6 text-sm text-muted-foreground">{t("nav.noMatches")}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <NotificationsPopover />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 ring-2 ring-background shadow-elev-sm">
                    {user?.photoURL ? <AvatarImage src={user.photoURL} alt={displayName} /> : null}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.email ?? "No email"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><User className="mr-2 h-4 w-4" /> {t("nav.profile")}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><Settings className="mr-2 h-4 w-4" /> {t("nav.accountSettings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={async () => {
                    await logout();
                    navigate("/auth");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} key={location.pathname} className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in focus:outline-none">
          {children}
        </main>
      </div>

      {/* Click outside overlay for FAB menu */}
      {fabMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/5 backdrop-blur-[1px]" 
          onClick={() => setFabMenuOpen(false)} 
        />
      )}

      {/* Floating action button menu */}
      {fabMenuOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2.5 animate-fade-in">
          {/* Manual Add Button */}
          {onQuickAdd && (
            <button
              onClick={() => {
                setFabMenuOpen(false);
                onQuickAdd();
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card hover:bg-secondary border border-border shadow-lg text-xs font-semibold hover-lift text-foreground transition-all"
            >
              <span>{t("fab.addManually")}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <Plus className="h-4 w-4" />
              </div>
            </button>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={() => {
              setFabMenuOpen(false);
              setAssistantOpen(true);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 text-xs font-semibold hover-lift transition-all"
          >
            <span>{t("fab.assistant")}</span>
            <div className="h-8 w-8 rounded-lg bg-white/20 text-white grid place-items-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setFabMenuOpen((prev) => !prev)}
        aria-label="Toggle quick actions menu"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      >
        <Plus
          className={cn(
            "h-6 w-6 mx-auto transition-transform duration-300",
            fabMenuOpen && "rotate-[135deg]"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Chat Assistant Widget */}
      <AssistantChatWidget
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onParseComplete={(parsed) => {
          setParsedData(parsed);
          setConfirmDialogOpen(true);
        }}
      />

      {/* Parsed Data Confirmation Popup */}
      <AssistantConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        parsedData={parsedData}
        onSaveSuccess={() => {
          setAssistantOpen(false);
          setParsedData(null);
        }}
      />

      {/* Accessibility widget */}
      <AccessibilityWidget hasSidebar={true} />

      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useSettings();
  return (
    <div className={cn("flex items-center gap-3 px-5", compact ? "" : "h-16 border-b border-sidebar-border")}>
      <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
        <Car className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base text-white">GarageOS</div>
        <div className="text-[11px] text-sidebar-foreground/70">{t("brand.subtitle")}</div>
      </div>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon, end, onClick }: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elev-sm relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary"
            : "text-sidebar-foreground"
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function UpsellCard() {
  const { t } = useSettings();
  return (
    <div className="m-3 p-4 rounded-xl bg-sidebar-accent/60 border border-sidebar-border">
      <div className="flex items-center gap-2 text-sidebar-primary mb-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{t("upsell.proTip")}</span>
      </div>
      <p className="text-xs text-sidebar-foreground/80 leading-relaxed">
        {t("upsell.desc")}
      </p>
    </div>
  );
}
