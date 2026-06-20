import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AccessibilityWidget } from "@/components/layout/AccessibilityWidget";
import { useSettings } from "@/context/settings";

const NotFound = () => {
  const location = useLocation();
  const { t } = useSettings();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("notfound.oops")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t("notfound.return")}
        </Link>
      </div>
      <AccessibilityWidget hasSidebar={false} />
    </div>
  );
};

export default NotFound;
