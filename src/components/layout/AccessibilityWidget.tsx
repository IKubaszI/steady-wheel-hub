import * as React from "react";
import { useSettings } from "@/context/settings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Accessibility,
  Contrast,
  Underline,
  Activity,
  Type,
  Smile,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessibilityWidgetProps {
  hasSidebar?: boolean;
}

export function AccessibilityWidget({ hasSidebar = false }: AccessibilityWidgetProps) {
  const {
    highContrast,
    reduceMotion,
    fontScale,
    dyslexiaFont,
    underlineLinks,
    setHighContrast,
    setReduceMotion,
    setFontScale,
    setDyslexiaFont,
    setUnderlineLinks,
  } = useSettings();

  const handleReset = () => {
    setHighContrast(false);
    setDyslexiaFont(false);
    setUnderlineLinks(false);
    setReduceMotion(false);
    setFontScale("normal");
  };

  const isConfigured = highContrast || dyslexiaFont || underlineLinks || reduceMotion || fontScale !== "normal";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id="a11y-floating-widget"
          type="button"
          aria-label="Accessibility options"
          title="Accessibility options"
          className={cn(
            "fixed bottom-6 z-40 h-14 w-14 rounded-full border border-border bg-card shadow-lg transition-all duration-300",
            "hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
            "flex items-center justify-center text-foreground hover:bg-secondary/80",
            hasSidebar ? "left-6 lg:left-72" : "left-6",
            isConfigured && "ring-2 ring-primary border-primary bg-primary/5 text-primary"
          )}
        >
          <Accessibility className="h-6 w-6" aria-hidden="true" />
          {isConfigured && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
              !
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        sideOffset={12}
        className="w-80 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xl backdrop-blur-md z-50 text-foreground animate-fade-in"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Accessibility className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight leading-none text-foreground">
                Accessibility Options
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Customize your display settings
              </p>
            </div>
          </div>

          {/* Settings List */}
          <div className="space-y-3.5 py-1">
            {/* High Contrast */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-2.5">
                <Contrast className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <Label htmlFor="a11y-high-contrast" className="text-xs font-semibold leading-none cursor-pointer">
                    High Contrast
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    High contrast color theme
                  </p>
                </div>
              </div>
              <Switch
                id="a11y-high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
                aria-label="Toggle High Contrast"
              />
            </div>

            {/* Dyslexia Font */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-2.5">
                <Smile className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <Label htmlFor="a11y-dyslexia" className="text-xs font-semibold leading-none cursor-pointer">
                    Dyslexia Font
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Dyslexia-friendly typeface
                  </p>
                </div>
              </div>
              <Switch
                id="a11y-dyslexia"
                checked={dyslexiaFont}
                onCheckedChange={setDyslexiaFont}
                aria-label="Toggle Dyslexia-friendly Font"
              />
            </div>

            {/* Underline Links */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-2.5">
                <Underline className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <Label htmlFor="a11y-underline" className="text-xs font-semibold leading-none cursor-pointer">
                    Underline Links
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Always underline hypertext links
                  </p>
                </div>
              </div>
              <Switch
                id="a11y-underline"
                checked={underlineLinks}
                onCheckedChange={setUnderlineLinks}
                aria-label="Toggle Underlined Links"
              />
            </div>

            {/* Reduce Motion */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-2.5">
                <Activity className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <Label htmlFor="a11y-reduce-motion" className="text-xs font-semibold leading-none cursor-pointer">
                    Reduce Motion
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Reduce screen motion and animation
                  </p>
                </div>
              </div>
              <Switch
                id="a11y-reduce-motion"
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
                aria-label="Toggle Reduced Motion"
              />
            </div>
          </div>

          {/* Font Scale Selector */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Type className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold leading-none">Text Size</Label>
                <p className="text-[10px] text-muted-foreground leading-none">Adjust body text scale</p>
              </div>
            </div>
            <ToggleGroup
              type="single"
              value={fontScale}
              onValueChange={(val) => {
                if (val) setFontScale(val as any);
              }}
              className="w-full grid grid-cols-3 gap-1 border border-border/80 rounded-xl p-1 bg-secondary/50"
            >
              <ToggleGroupItem
                value="normal"
                className="text-[11px] h-8 font-medium rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm"
                aria-label="Normal text size"
              >
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem
                value="large"
                className="text-xs h-8 font-semibold rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm"
                aria-label="Large text size"
              >
                Large
              </ToggleGroupItem>
              <ToggleGroupItem
                value="xl"
                className="text-sm h-8 font-bold rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm"
                aria-label="Extra large text size"
              >
                XL
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Footer Reset */}
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 h-9 rounded-xl border-dashed border-muted-foreground/30 hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
