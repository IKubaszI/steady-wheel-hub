import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "PLN" | "JPY";
export type PrimaryColor = "ocean" | "violet" | "emerald" | "rose" | "amber";
export type FontScale = "normal" | "large" | "xl";

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  PLN: "zł",
  JPY: "¥",
};

type SettingsValue = {
  currency: Currency;
  symbol: string;
  primaryColor: PrimaryColor;
  setCurrency: (c: Currency) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  format: (n: number, opts?: { decimals?: number }) => string;
  // a11y
  highContrast: boolean;
  reduceMotion: boolean;
  fontScale: FontScale;
  dyslexiaFont: boolean;
  underlineLinks: boolean;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setFontScale: (v: FontScale) => void;
  setDyslexiaFont: (v: boolean) => void;
  setUnderlineLinks: (v: boolean) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);
const STORAGE_KEY = "garageos.settings";
const PRIMARY_COLOR_TOKENS: Record<PrimaryColor, { primary: string; glow: string; ring: string; sidebarPrimary: string }> = {
  ocean: { primary: "198 93% 38%", glow: "190 95% 50%", ring: "198 93% 42%", sidebarPrimary: "198 93% 50%" },
  violet: { primary: "262 83% 52%", glow: "270 95% 65%", ring: "262 83% 57%", sidebarPrimary: "262 90% 62%" },
  emerald: { primary: "152 70% 40%", glow: "158 75% 52%", ring: "152 70% 45%", sidebarPrimary: "152 75% 50%" },
  rose: { primary: "342 84% 52%", glow: "338 92% 62%", ring: "342 84% 57%", sidebarPrimary: "342 90% 62%" },
  amber: { primary: "35 95% 45%", glow: "42 98% 58%", ring: "35 95% 50%", sidebarPrimary: "35 95% 55%" },
};

function applyPrimaryColorTokens(color: PrimaryColor) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const tokens = PRIMARY_COLOR_TOKENS[color];
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-glow", tokens.glow);
  root.style.setProperty("--ring", tokens.ring);
  root.style.setProperty("--sidebar-primary", tokens.sidebarPrimary);
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${tokens.primary}), hsl(${tokens.glow}))`);
  root.style.setProperty("--shadow-glow", `0 10px 30px -10px hsl(${tokens.ring} / 0.45)`);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const initialSettings = useMemo(() => {
    if (typeof window === "undefined") {
      return { currency: "USD" as Currency, primaryColor: "ocean" as PrimaryColor, highContrast: false, reduceMotion: false, fontScale: "normal" as FontScale, dyslexiaFont: false, underlineLinks: false };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const parsedCurrency = parsed?.currency && parsed.currency in SYMBOLS ? (parsed.currency as Currency) : "USD";
        const parsedPrimaryColor = parsed?.primaryColor && parsed.primaryColor in PRIMARY_COLOR_TOKENS
          ? (parsed.primaryColor as PrimaryColor)
          : "ocean";
        const fs = (["normal", "large", "xl"].includes(parsed?.fontScale) ? parsed.fontScale : "normal") as FontScale;
        return {
          currency: parsedCurrency,
          primaryColor: parsedPrimaryColor,
          highContrast: !!parsed?.highContrast,
          reduceMotion: !!parsed?.reduceMotion,
          fontScale: fs,
          dyslexiaFont: !!parsed?.dyslexiaFont,
          underlineLinks: !!parsed?.underlineLinks,
        };
      }
    } catch {
      return { currency: "USD" as Currency, primaryColor: "ocean" as PrimaryColor, highContrast: false, reduceMotion: false, fontScale: "normal" as FontScale, dyslexiaFont: false, underlineLinks: false };
    }
    return { currency: "USD" as Currency, primaryColor: "ocean" as PrimaryColor, highContrast: false, reduceMotion: false, fontScale: "normal" as FontScale, dyslexiaFont: false, underlineLinks: false };
  }, []);
  const [currency, setCurrencyState] = useState<Currency>(initialSettings.currency);
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(initialSettings.primaryColor);
  const [highContrast, setHighContrast] = useState<boolean>(initialSettings.highContrast);
  const [reduceMotion, setReduceMotion] = useState<boolean>(initialSettings.reduceMotion);
  const [fontScale, setFontScale] = useState<FontScale>(initialSettings.fontScale);
  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(initialSettings.dyslexiaFont);
  const [underlineLinks, setUnderlineLinks] = useState<boolean>(initialSettings.underlineLinks);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency, primaryColor, highContrast, reduceMotion, fontScale, dyslexiaFont, underlineLinks }));
  }, [currency, primaryColor, highContrast, reduceMotion, fontScale, dyslexiaFont, underlineLinks]);

  useEffect(() => {
    applyPrimaryColorTokens(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-high-contrast", highContrast);
    root.classList.toggle("a11y-reduce-motion", reduceMotion);
    root.classList.toggle("a11y-dyslexia", dyslexiaFont);
    root.classList.toggle("a11y-underline-links", underlineLinks);
    root.dataset.fontScale = fontScale;
  }, [highContrast, reduceMotion, fontScale, dyslexiaFont, underlineLinks]);

  const value = useMemo<SettingsValue>(() => {
    const symbol = SYMBOLS[currency];
    return {
      currency,
      symbol,
      primaryColor,
      setCurrency: setCurrencyState,
      setPrimaryColor: setPrimaryColorState,
      format: (n, opts) => {
        const decimals = opts?.decimals ?? 2;
        const num = (n ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return currency === "PLN" ? `${num} ${symbol}` : `${symbol}${num}`;
      },
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
    };
  }, [currency, primaryColor, highContrast, reduceMotion, fontScale, dyslexiaFont, underlineLinks]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const v = useContext(SettingsContext);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}