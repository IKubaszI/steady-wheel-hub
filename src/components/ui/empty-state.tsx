import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn("glass-card flex flex-col items-center justify-center text-center px-6 py-16 animate-scale-in", className)}>
      <div className="relative mb-5">
        <span aria-hidden className="absolute inset-0 -z-10 blur-2xl rounded-full bg-gradient-primary opacity-40 scale-150" />
        <span className="h-16 w-16 rounded-2xl grid place-items-center bg-gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-7 w-7" />
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}