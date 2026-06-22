import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Receipt,
  Camera,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  User,
} from "lucide-react";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { AddVehicleForm } from "@/components/forms/AddVehicleForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";

const steps = [
  {
    id: "sidebar-link-dashboard",
    titleKey: "tutorial.step.dashboard.title" as const,
    descKey: "tutorial.step.dashboard.desc" as const,
    icon: LayoutDashboard,
    to: "/",
  },
  {
    id: "sidebar-link-vehicles",
    titleKey: "tutorial.step.vehicles.title" as const,
    descKey: "tutorial.step.vehicles.desc" as const,
    icon: Car,
    to: "/vehicles",
  },
  {
    id: "sidebar-link-maintenance",
    titleKey: "tutorial.step.maintenance.title" as const,
    descKey: "tutorial.step.maintenance.desc" as const,
    icon: Wrench,
    to: "/maintenance",
  },
  {
    id: "sidebar-link-receipts",
    titleKey: "tutorial.step.receipts.title" as const,
    descKey: "tutorial.step.receipts.desc" as const,
    icon: Receipt,
    to: "/receipts",
  },
  {
    id: "sidebar-link-receipt-photos",
    titleKey: "tutorial.step.receiptPhotos.title" as const,
    descKey: "tutorial.step.receiptPhotos.desc" as const,
    icon: Camera,
    to: "/receipt-photos",
  },
  {
    id: "sidebar-link-analytics",
    titleKey: "tutorial.step.analytics.title" as const,
    descKey: "tutorial.step.analytics.desc" as const,
    icon: BarChart3,
    to: "/analytics",
  },
  {
    id: "sidebar-link-pro-tips",
    titleKey: "tutorial.step.proTips.title" as const,
    descKey: "tutorial.step.proTips.desc" as const,
    icon: Sparkles,
    to: "/pro-tips",
  },
  {
    id: "header-profile-menu",
    titleKey: "tutorial.step.profile.title" as const,
    descKey: "tutorial.step.profile.desc" as const,
    icon: User,
    to: "/pro-tips",
  },
];

export function TutorialTour() {
  const navigate = useNavigate();
  const { vehicles } = useGarageData();
  const { t } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const [forceCreate, setForceCreate] = useState(false);
  const [stepIndex, setStepIndex] = useState<number | "finish" | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize and check onboarding status
  useEffect(() => {
    const onboarding = sessionStorage.getItem("steadywheelhub.onboarding");
    if (onboarding === "1") {
      if (vehicles.length === 0) {
        setForceCreate(true);
      } else {
        sessionStorage.removeItem("steadywheelhub.onboarding");
        sessionStorage.setItem("steadywheelhub.tutorialStep", "0");
        setForceCreate(false);
        setStepIndex(0);
      }
    } else {
      setForceCreate(false);
    }
  }, [vehicles.length]);

  useEffect(() => {
    if (authLoading) return;

    // Auto-start tutorial on entering/refreshing for the demo user
    const isDemoUser = user?.email?.toLowerCase().includes("testowy") || user?.email?.toLowerCase().includes("demo") || user?.uid === "demo-user";
    if (isDemoUser) {
      const dismissed = sessionStorage.getItem("steadywheelhub.tutorialDismissed");
      const storedStep = sessionStorage.getItem("steadywheelhub.tutorialStep");
      if (dismissed !== "1" && storedStep === null) {
        sessionStorage.setItem("steadywheelhub.tutorialStep", "0");
        setStepIndex(0);
        return;
      }
    }

    const demoOnboarding = sessionStorage.getItem("steadywheelhub.demoOnboarding");
    if (demoOnboarding === "1") {
      sessionStorage.removeItem("steadywheelhub.demoOnboarding");
      sessionStorage.setItem("steadywheelhub.tutorialStep", "0");
      setStepIndex(0);
      return;
    }

    const storedStep = sessionStorage.getItem("steadywheelhub.tutorialStep");
    if (storedStep === "finish") {
      setStepIndex("finish");
    } else if (storedStep !== null) {
      const idx = parseInt(storedStep, 10);
      if (!isNaN(idx) && idx >= 0 && idx < steps.length) {
        setStepIndex(idx);
      }
    }
  }, [user, authLoading]);

  // Monitor screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Spotlight positioning logic (Desktop only)
  useEffect(() => {
    if (stepIndex === null || stepIndex === "finish" || isMobile) {
      setRect(null);
      return;
    }

    const elementId = steps[stepIndex].id;
    const updateRect = () => {
      const el = document.getElementById(elementId);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);
    const timer = setInterval(updateRect, 100);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      clearInterval(timer);
    };
  }, [stepIndex, isMobile]);

  const handleCarCreated = () => {
    sessionStorage.removeItem("steadywheelhub.onboarding");
    sessionStorage.setItem("steadywheelhub.tutorialStep", "0");
    setForceCreate(false);
    setStepIndex(0);
  };

  const handleNext = () => {
    if (stepIndex === null || stepIndex === "finish") return;
    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) {
      sessionStorage.setItem("steadywheelhub.tutorialStep", String(nextIdx));
      setStepIndex(nextIdx);
      navigate(steps[nextIdx].to);
    } else {
      sessionStorage.setItem("steadywheelhub.tutorialStep", "finish");
      setStepIndex("finish");
    }
  };

  const handleBack = () => {
    if (stepIndex === null || stepIndex === "finish" || stepIndex === 0) return;
    const prevIdx = stepIndex - 1;
    sessionStorage.setItem("steadywheelhub.tutorialStep", String(prevIdx));
    setStepIndex(prevIdx);
    navigate(steps[prevIdx].to);
  };

  const handleSkip = () => {
    sessionStorage.setItem("steadywheelhub.tutorialDismissed", "1");
    sessionStorage.removeItem("steadywheelhub.tutorialStep");
    setStepIndex(null);
  };

  const handleFinish = () => {
    sessionStorage.setItem("steadywheelhub.tutorialDismissed", "1");
    sessionStorage.removeItem("steadywheelhub.tutorialStep");
    setStepIndex(null);
  };

  // Render Forced Vehicle Creation Flow
  if (forceCreate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-card/95 border border-border/80 rounded-3xl shadow-elev-lg max-w-lg w-full p-6 md:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow animate-bounce">
              <Car className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
              {t("tutorial.forceCreate.title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t("tutorial.forceCreate.desc")}
            </p>
          </div>
          <AddVehicleForm onClose={handleCarCreated} hideCancel={true} />
        </div>
      </div>
    );
  }

  // Render Finished Congratulations Screen
  if (stepIndex === "finish") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 text-center space-y-5 shadow-elev-lg">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow animate-bounce">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl">
              {t("tutorial.tour.congrats")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("tutorial.tour.congratsDesc")}
            </p>
          </div>
          <Button
            onClick={handleFinish}
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow py-5 text-sm font-semibold rounded-xl"
          >
            {t("tutorial.tour.finish")}
          </Button>
        </div>
      </div>
    );
  }

  // Render Spotlight / Step Card Flow
  if (stepIndex !== null) {
    const currentStep = steps[stepIndex];
    const StepIcon = currentStep.icon;

    // Calculate spotlight cutout values
    const pad = 6;
    const x = rect ? rect.left - pad : 0;
    const y = rect ? rect.top - pad : 0;
    const w = rect ? rect.width + pad * 2 : 0;
    const h = rect ? rect.height + pad * 2 : 0;

    const cardStyle = rect
      ? {
          position: "fixed" as const,
          left: `${rect.right + 20}px`,
          top: `${Math.min(rect.top, window.innerHeight - 250)}px`,
          zIndex: 50,
        }
      : {
          position: "fixed" as const,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 50,
        };

    return (
      <>
        {/* Backdrop overlay */}
        {rect ? (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-40 transition-all duration-300">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.55)"
              mask="url(#spotlight-mask)"
              className="pointer-events-auto"
            />
          </svg>
        ) : (
          <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm pointer-events-auto" />
        )}

        {/* Guided card */}
        <div
          style={cardStyle}
          className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-5 shadow-elev-lg animate-fade-in text-foreground"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <StepIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                {t("tutorial.tour.title")} · {stepIndex + 1} / {steps.length}
              </div>
              <h3 className="font-display font-bold text-base">
                {t(currentStep.titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {t(currentStep.descKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 pt-3 border-t border-border/60">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground text-xs h-8"
            >
              {t("tutorial.tour.skip")}
            </Button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-1 text-xs px-2.5 h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t("tutorial.tour.back")}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1 text-xs px-3 h-8 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
              >
                {stepIndex === steps.length - 1 ? (
                  <>
                    {t("tutorial.tour.finish")}
                    <CheckCircle className="h-3.5 w-3.5 ml-0.5" />
                  </>
                ) : (
                  <>
                    {t("tutorial.tour.next")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
