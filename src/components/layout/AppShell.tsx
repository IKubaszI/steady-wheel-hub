import { useMemo, useState, useEffect, type MouseEventHandler } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Car, Wrench, Receipt, BarChart3, Search, Menu, X, Plus, Settings, Sparkles, Camera, LogOut, User, Download, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
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
import { TutorialTour } from "./TutorialTour";
import { usePwaAnimationStore } from "@/stores/pwa-animation-store";

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

  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("open-settings", handleOpenSettings);
    return () => window.removeEventListener("open-settings", handleOpenSettings);
  }, []);

  const navItems = useMemo(() => [
    { id: "sidebar-link-dashboard", to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { id: "sidebar-link-vehicles", to: "/vehicles", label: t("nav.vehicles"), icon: Car },
    { id: "sidebar-link-maintenance", to: "/maintenance", label: t("nav.maintenance"), icon: Wrench },
    { id: "sidebar-link-receipts", to: "/receipts", label: t("nav.receipts"), icon: Receipt },
    { id: "sidebar-link-receipt-photos", to: "/receipt-photos", label: t("nav.receiptPhotos"), icon: Camera },
    { id: "sidebar-link-analytics", to: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
    { id: "sidebar-link-pro-tips", to: "/pro-tips", label: t("nav.proTips"), icon: Sparkles },
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
      <TutorialTour />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Sidebar — desktop */}
      <aside aria-label="Primary navigation" className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-30">
        <Brand />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <PWAInstallCard />
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
            <PWAInstallCard />
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
                <button id="header-profile-menu" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 ring-2 ring-background shadow-elev-sm">
                    {user?.photoURL ? <AvatarImage src={user.photoURL} alt={displayName} /> : null}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="min-w-0">
                  <div className="font-semibold truncate" title={displayName}>{displayName}</div>
                  <div className="text-xs font-normal text-muted-foreground truncate" title={user?.email ?? "No email"}>{user?.email ?? "No email"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><User className="mr-2 h-4 w-4" /> {t("nav.profile")}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><Settings className="mr-2 h-4 w-4" /> {t("nav.accountSettings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={async () => {
                    sessionStorage.removeItem("steadywheelhub.tutorialStep");
                    sessionStorage.removeItem("steadywheelhub.onboarding");
                    sessionStorage.removeItem("steadywheelhub.demoOnboarding");
                    sessionStorage.removeItem("steadywheelhub.tutorialDismissed");
                    sessionStorage.removeItem("steadywheelhub.pwaDismissedSession");
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

function SidebarLink({ id, to, label, icon: Icon, end, onClick }: { id?: string; to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <NavLink
      id={id}
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

function PWAInstallCard() {
  const { language } = useSettings();
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showGenericInstructions, setShowGenericInstructions] = useState(false);

  // Globalny stan (zustand, w pamięci RAM) — animacja "scale-in" odpala się
  // tylko raz na załadowanie strony. Nawigacja SPA remontuje AppShell (każda
  // strona renderuje własny <AppShell>), ale stan w RAM przetrwa remont, więc
  // animacja NIE odtwarza się przy zmianie strony. Dopiero F5/odświeżenie
  // resetuje stan i animacja gra ponownie.
  const { hasAnimated, markAnimated } = usePwaAnimationStore();
  const shouldAnimate = !hasAnimated;

  // Oznacz animację jako odtworzoną dopiero PO jej zakończeniu (250ms z
  // animate-scale-in), aby flip flagi nie ucinał trwającej animacji.
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => markAnimated(), 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, markAnimated]);

  const isDemo = user?.email?.toLowerCase().includes("testowy") || user?.email?.toLowerCase().includes("demo") || user?.uid === "demo-user";

  useEffect(() => {
    // Check if standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Check if dismissed
    let dismissed = false;
    if (isDemo) {
      dismissed = window.sessionStorage.getItem('steadywheelhub.pwaDismissedSession') === '1';
    } else {
      dismissed = window.localStorage.getItem('steadywheelhub.pwaDismissed') === '1';
    }
    setIsDismissed(dismissed);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isDemo]);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setShowIOSInstructions(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowGenericInstructions(true);
    }
  };

  const handleDismiss = () => {
    if (isDemo) {
      window.sessionStorage.setItem('steadywheelhub.pwaDismissedSession', '1');
    } else {
      window.localStorage.setItem('steadywheelhub.pwaDismissed', '1');
    }
    setIsDismissed(true);
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      <div className={`relative m-3 p-4 rounded-xl bg-sidebar-accent/60 border border-sidebar-border/80 shadow-md flex flex-col gap-3${shouldAnimate ? ' animate-scale-in' : ''}`}>
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-0.5 rounded-md hover:bg-sidebar-accent"
          aria-label={language === "pl" ? "Zamknij" : "Dismiss"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2.5 text-sidebar-primary pr-6">
          <Download className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {language === "pl" ? "Aplikacja Mobilna" : "Mobile App"}
          </span>
        </div>
        <p className="text-xs text-sidebar-foreground/80 leading-relaxed pr-2">
          {language === "pl" 
            ? "Zainstaluj GarageOS na pulpicie telefonu lub komputera, aby mieć szybki dostęp offline."
            : "Install GarageOS on your phone or computer screen for quick, offline-ready access."}
        </p>
        <Button 
          size="sm" 
          onClick={handleInstallClick} 
          className="w-full text-xs font-semibold py-2 bg-gradient-primary hover:opacity-90 transition-all text-primary-foreground shadow-glow gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          {language === "pl" ? "Zainstaluj aplikację" : "Install App"}
        </Button>
      </div>

      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center space-y-4">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-1">
              <Share2 className="h-6 w-6 animate-pulse" />
            </div>
            <DialogTitle className="font-display font-bold text-lg text-foreground">
              {language === "pl" ? "Zainstaluj na iPhone" : "Install on iPhone"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              {language === "pl" ? (
                <>
                  Aby dodać aplikację do ekranu głównego:<br />
                  1. Kliknij ikonę <strong>Udostępnij</strong> na dolnym pasku przeglądarki Safari.<br />
                  2. Przewiń w dół i wybierz <strong>Dodaj do ekranu początkowego</strong>.
                </>
              ) : (
                <>
                  To add the app to your home screen:<br />
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
                  2. Scroll down and select <strong>Add to Home Screen</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowIOSInstructions(false)} className="w-full bg-secondary hover:bg-secondary/80 text-foreground">
            {language === "pl" ? "Rozumiem" : "Got it"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenericInstructions} onOpenChange={setShowGenericInstructions}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center space-y-4">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-1">
              <Download className="h-6 w-6 animate-pulse" />
            </div>
            <DialogTitle className="font-display font-bold text-lg text-foreground">
              {language === "pl" ? "Jak zainstalować aplikację?" : "How to install?"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              {language === "pl" ? (
                <>
                  Jeśli używasz przeglądarki Chrome/Edge na komputerze:<br />
                  1. Spójrz na <strong>pasek adresu</strong> u góry przeglądarki.<br />
                  2. Kliknij ikonę <strong>Zainstaluj</strong> (monitor ze strzałką w dół) po prawej stronie paska adresu, lub rozwiń menu i wybierz <strong>Zainstaluj aplikację GarageOS</strong>.<br /><br />
                  Na telefonie:<br />
                  Rozwiń menu przeglądarki i wybierz <strong>Dodaj do ekranu głównego / Zainstaluj</strong>.
                </>
              ) : (
                <>
                  If you are using Chrome/Edge on desktop:<br />
                  1. Look at the <strong>address bar</strong> at the top right.<br />
                  2. Click the <strong>Install icon</strong> (monitor with down arrow) or open the browser menu and select <strong>Install GarageOS App</strong>.<br /><br />
                  On mobile:<br />
                  Open your browser's menu and tap <strong>Add to Home Screen / Install</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowGenericInstructions(false)} className="w-full bg-secondary hover:bg-secondary/80 text-foreground">
            {language === "pl" ? "Rozumiem" : "Got it"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

