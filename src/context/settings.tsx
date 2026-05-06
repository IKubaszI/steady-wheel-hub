import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "PLN" | "JPY";

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
  setCurrency: (c: Currency) => void;
  format: (n: number, opts?: { decimals?: number }) => string;
};

const SettingsContext = createContext<SettingsValue | null>(null);
const STORAGE_KEY = "garageos.settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "USD";
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.currency && parsed.currency in SYMBOLS) return parsed.currency as Currency;
      }
    } catch {}
    return "USD";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency }));
  }, [currency]);

  const value = useMemo<SettingsValue>(() => {
    const symbol = SYMBOLS[currency];
    return {
      currency,
      symbol,
      setCurrency: setCurrencyState,
      format: (n, opts) => {
        const decimals = opts?.decimals ?? 2;
        const num = (n ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return currency === "PLN" ? `${num} ${symbol}` : `${symbol}${num}`;
      },
    };
  }, [currency]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const v = useContext(SettingsContext);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}