# Notatka UX — Steady Wheel Hub

Dokument ten opisuje grupę docelową, szczegółową personę użytkownika, uzasadnienie kluczowych decyzji projektowych (UI/UX) w oparciu o zasady projektowania zorientowanego na użytkownika (UCD) oraz odniesienie do 10 Heurystyk Użyteczności Jakoba Nielsena.

---

## 1. Grupa docelowa i Persona

### Grupa docelowa
Główną grupą docelową są **indywidualni właściciele pojazdów** oraz **drobni przedsiębiorcy** (zarządzający 1-3 samochodami w ramach jednoosobowej działalności gospodarczej). Są to osoby w wieku 20–60 lat, które szukają prostego, cyfrowego asystenta do kontroli wydatków i terminów serwisowych, bez konieczności prowadzenia skomplikowanych arkuszy kalkulacyjnych.

### Persona: Michał (34 lata)
* **Zawód:** Inżynier budowy, prowadzący jednoosobową działalność.
* **Sytuacja:** Posiada prywatno-służbowe auto (SUV) oraz zarządza hatchbackiem żony. Dużo podróżuje między placami budowy.
* **Problemy i wyzwania:**
  * Często gubi paragony za paliwo, płyn do spryskiwaczy czy drobne naprawy, co utrudnia mu rozliczanie kosztów.
  * Zdarza mu się zapomnieć o terminie przeglądu technicznego lub wymianie filtrów i oleju.
  * Nie ma czasu na naukę skomplikowanych systemów flotowych.
* **Potrzeby w aplikacji:**
  * **Szybkość:** Chce mieć możliwość dodania wydatku w 15 sekund na stacji benzynowej zaraz po zatankowaniu.
  * **Mobilność:** Aplikacja musi działać idealnie na smartfonie.
  * **Czytelność:** Jeden rzut oka na ekran główny musi mu powiedzieć, które auto wymaga uwagi i kiedy przypada najbliższy serwis.

---

## 2. Kluczowe decyzje UI/UX i Uzasadnienie (UCD)

Projektowanie aplikacji opierało się na metodologii **User-Centered Design (UCD)**. Główne decyzje projektowe obejmują:

1. **Podejście Mobile-First / Responsywność:**
   * Ponieważ Michał najczęściej korzysta z aplikacji poza domem (stacja benzynowa, warsztat), interfejs został zoptymalizowany pod kątem ekranów mobilnych. Przyciski akcji (CTA) posiadają minimalną strefę kliknięcia 44x44px, zapobiegając przypadkowym kliknięciom.
2. **Minimalizacja obciążenia poznawczego (Cognitive Load):**
   * Formularz dodawania kosztu/rachunku został skrócony do niezbędnego minimum: wybór pojazdu, kwota, kategoria, data oraz opcjonalne zdjęcie paragonu. Pola opcjonalne są wyraźnie oznaczone.
3. **Kodowanie kolorystyczne (Color Coding) statusów:**
   * Zastosowano spójny system kolorów semantycznych dla terminów serwisowych:
     * **Czerwony:** Wydarzenia przeterminowane (Overdue) – wymagana natychmiastowa akcja.
     * **Żółty/Pomarańczowy:** Nadchodzące wydarzenia (Upcoming) – do zaplanowania w najbliższym czasie.
     * **Zielony:** Zrealizowane (Completed).
   * Dzięki temu użytkownik w ułamku sekundy ocenia status floty bez konieczności czytania szczegółowych dat.

---

## 3. Odniesienie do Heurystyk Użyteczności Nielsena

Zaimplementowane rozwiązania UI/UX bezpośrednio korespondują z uznanymi heurystykami projektowania systemów interaktywnych:

### Heurystyka #1: Pokazywanie statusu systemu (Visibility of system status)
* **Implementacja:** Podczas wgrywania zdjęcia paragonu do Cloudinary, użytkownik widzi animację ładowania (loader) oraz zablokowane przyciski formularza, co zapobiega powtórnemu wysłaniu danych. Po pomyślnym dodaniu wpisu pojawia się dynamiczne powiadomienie (Toast/Alert) informujące o sukcesie.

### Heurystyka #2: Zachowanie spójności między systemem a rzeczywistością (Match between system and the real world)
* **Implementacja:** Używamy języka naturalnego dla kierowców (np. „Przebieg”, „Ubezpieczenie OC”, „Paragon”, „Wymiana oleju”) zamiast żargonu bazodanowego lub technicznego. Ikony są powszechnie rozpoznawalne w kontekście motoryzacyjnym (klucz płaski dla serwisu, ikona aparatu/dokumentu dla paragonu).

### Heurystyka #3: Dający się kontrolować i elastyczny system (User control and freedom)
* **Implementacja:** Każdy formularz (dodawania pojazdu, kosztu czy serwisu) ma wyraźny przycisk „Anuluj”. W przypadku pomyłki, użytkownik ma pełną swobodę w edycji oraz usuwaniu istniejących wpisów z poziomu szczegółów pojazdu/rachunku.

### Heurystyka #4: Spójność i standardy (Consistency and standards)
* **Implementacja:** Aplikacja trzyma się spójnego systemu projektowego (Design System) opartego o Tailwind CSS. Kolory, zaokrąglenia przycisków, typografia (Inter/Outfit) oraz styl ikon są jednolite na wszystkich podstronach. Komponenty nawigacyjne (Navbar/Sidebar) znajdują się w standardowych dla aplikacji webowych miejscach.

### Heurystyka #5: Zapobieganie błędom (Error prevention)
* **Implementacja:** Formularze posiadają wbudowane mechanizmy walidacji przed wysłaniem danych (np. blokada wprowadzania ujemnych kwot, wymóg wyboru pojazdu z listy, maksymalna długość znaków). Przycisk zapisu jest nieaktywny bądź formularz zgłasza czytelne błędy walidacji, jeśli kluczowe dane są niepoprawne.

### Heurystyka #6: Rozpoznawanie zamiast przypominania (Recognition rather than recall)
* **Implementacja:** Dashboard wyświetla najważniejsze skróty informacji: listę aktywnych pojazdów wraz z ich marką/modelem oraz skrócony rejestr ostatnich kosztów i najbliższych przeglądów. Użytkownik nie musi pamiętać, jakie wydatki ostatnio wprowadził ani wchodzić głęboko w strukturę menu, aby to sprawdzić.

---

## 4. Dostępność (Accessibility / WCAG)

W trosce o inkluzywność aplikacji wdrożono:
* **Semantyczny HTML:** Formularze korzystają z poprawnych powiązań `<label for="...">` i `<input id="...">`, co ułatwia obsługę przez czytniki ekranu (Screen Readers).
* **Kontrast i focus:** Elementy interaktywne mają wyraźnie zdefiniowaną ramkę focusa (`focus-visible`), ułatwiającą nawigację klawiaturą.
* **Tryb wysokiego kontrastu / Ciemny motyw:** Dostępny z poziomu ustawień aplikacji, co pozwala na wygodne korzystanie przy słabym oświetleniu (np. w nocy w aucie).

---

## 5. Wnioski z obserwacji i testów użyteczności (Usability Testing)

Podczas fazy prototypowania przeprowadzono krótkie testy korytarzowe (Hallway Testing) na grupie 3 użytkowników końcowych:
1. **Obserwacja:** Użytkownicy mieli trudność z szybkim zorientowaniem się, który serwis jest najpilniejszy przy dużej liście aut.
   * **Rozwiązanie:** Wprowadzono sekcję "Najbliższe terminy" na samej górze Dashboardu, agregującą zadania ze wszystkich pojazdów.
2. **Obserwacja:** Podczas wgrywania dużych zdjęć paragonów na słabszym połączeniu mobilnym, użytkownicy klikali przycisk "Zapisz" wielokrotnie.
   * **Rozwiązanie:** Dodano blokadę przycisku (disabled state) oraz spinner podczas operacji I/O.

