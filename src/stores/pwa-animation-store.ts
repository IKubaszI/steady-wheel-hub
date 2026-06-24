import { create } from 'zustand';

/**
 * Zustand store do kontrolowania animacji PWAInstallCard.
 *
 * Cel: animacja `animate-scale-in` powinna odpalić się TYLKO RAZ po
 * załadowaniu/odświeżeniu strony, ale NIE przy nawigacji między stronami SPA.
 *
 * Mechanizm:
 * - Zustand trzyma stan w pamięci RAM → odświeżenie (F5) resetuje stan → animacja odpala się
 * - Nawigacja SPA NIE resetuje pamięci → flaga `hasAnimated = true` → brak animacji
 *
 * Nie używamy sessionStorage/localStorage — czysty stan w pamięci
 * gwarantuje, że każde odświeżenie = nowa animacja.
 */

interface PwaAnimationState {
  /** Czy animacja już się odpalała od ostatniego załadowania strony */
  hasAnimated: boolean;
  /** Wywołać po pierwszym renderze animowanego komponentu */
  markAnimated: () => void;
}

export const usePwaAnimationStore = create<PwaAnimationState>((set) => ({
  hasAnimated: false,

  markAnimated: () => {
    set({ hasAnimated: true });
  },
}));
