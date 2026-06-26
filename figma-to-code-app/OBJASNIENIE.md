# Objasnienie projektu "Kompilator Figma-to-Code"

Dokument tlumaczy **co robi kazda czesc aplikacji, jak dziala, dlaczego tak zostala
napisana i jakich technologii uzyto**. Napisany pod oddanie projektu - mozesz czytac
od gory do dolu.

---

## 1. Cel aplikacji

Aplikacja pokazuje **trzy sposoby zamiany projektu graficznego (Figma / makieta) na
gotowy kod HTML i CSS**:

1. **Tokeny z Figmy** - pobiera kolory/zmienne z pliku Figmy i zamienia je na zmienne CSS.
2. **AI Kompilator Designu** - wysyla zrzut ekranu makiety do modelu AI (Google Gemini),
   ktory zwraca kod HTML + CSS.
3. **Figma do HTML** - pobiera strukture ramki przez REST API Figmy i zamienia wezly na
   kod **wlasnym parserem** (bez AI).

Calosc dziala w przegladarce - nie ma wlasnego backendu/serwera.

---

## 2. Stos technologiczny (czego uzyto i dlaczego)

| Technologia | Wersja | Po co |
|-------------|--------|-------|
| **React** | 19 | Budowa interfejsu z komponentow i zarzadzanie stanem (`useState`). |
| **Vite** | 8 | Bardzo szybki dev-server i bundler (build produkcyjny). |
| **@vitejs/plugin-react** | 6 | Obsluga JSX i Fast Refresh (HMR) w Vite. |
| **lucide-react** | 1.x | Biblioteka ikon (dostepna, choc UI jest oparty glownie na tekscie). |
| **oxlint** | 1.x | Bardzo szybki linter (sprawdza bledy i nieuzywany kod). |

**Czysty HTML5 + CSS** (plik `App.css`) - bez Tailwinda/Bootstrapa, zeby kod byl prosty
i czytelny. Komunikacja z Figma i Gemini odbywa sie przez **`fetch`** (wbudowane w przegladarke -
zero dodatkowych bibliotek HTTP).

**Dlaczego React + Vite?** To standardowy, lekki zestaw do aplikacji SPA. React pozwala
podzielic ekran na komponenty (zakladki) i reagowac na zmiany stanu, a Vite daje szybki
start i prosty build.

---

## 3. Struktura plikow

```
figma-to-code-app/
├─ index.html              # punkt wejscia HTML (montuje React w #root)
├─ vite.config.js          # konfiguracja Vite (plugin React)
├─ package.json            # zaleznosci i skrypty (dev / build / lint)
└─ src/
   ├─ main.jsx             # start aplikacji - renderuje <App/>
   ├─ App.jsx              # uklad, naglowek, zakladki, wspolny stan kluczy
   ├─ App.css              # wszystkie style aplikacji
   ├─ index.css            # globalny reset (html, body, #root)
   ├─ api/
   │  ├─ figmaApi.js       # polaczenie z REST API Figmy
   │  └─ geminiApi.js      # polaczenie z AI Google Gemini
   ├─ utils/
   │  ├─ figmaColors.js    # konwersja kolorow Figmy -> CSS
   │  ├─ figmaParser.js    # parser wezlow Figmy -> HTML/CSS
   │  └─ renderIframeSrc.js# budowa dokumentu do podgladu w <iframe>
   └─ components/
      ├─ TabTokens.jsx     # zakladka 1
      ├─ TabCompiler.jsx   # zakladka 2
      ├─ TabFigmaHTML.jsx  # zakladka 3
      └─ CodeViewer.jsx    # podglad kodu (numery linii, Kopiuj/Pobierz)
```

---

## 4. Jak uruchamia sie aplikacja (od kliknięcia do ekranu)

1. **`index.html`** zawiera `<div id="root"></div>` i laduje `src/main.jsx` jako modul.
2. **`main.jsx`** tworzy React-owy "root" i renderuje komponent `<App/>` w `#root`:

   ```jsx
   createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>);
   ```

   `StrictMode` to tryb pomagajacy wychwycic bledy w czasie developmentu (nie wplywa na produkcje).
3. **`App.jsx`** rysuje naglowek, przyciski zakladek i - zaleznie od wybranej zakladki -
   jeden z trzech komponentow.

---

## 5. `App.jsx` - serce ukladu i wspolny stan

Najwazniejsze elementy:

- **`useState('tokens')`** - pamieta, ktora zakladka jest aktywna (`tokens` / `vision` / `figma-html`).
- **Wspolny stan kluczy** trzymany w `App`, a nie w zakladkach:
  - `figmaFileKey`, `figmaToken` - uzywane przez zakladke 1 **i** 3,
  - `geminiKey` - uzywany przez zakladke 2.
- Klucze maja wartosc poczatkowa z **zmiennych srodowiskowych Vite** (`import.meta.env.VITE_...`),
  wiec mozna je ustawic raz w pliku `.env` zamiast wpisywac recznie.

**Dlaczego stan kluczy jest w `App`, a nie w zakladkach?**
Bo zakladki 1 i 3 korzystaja z tych samych danych logowania do Figmy. Trzymajac je
"wyzej" (w rodzicu) i przekazujac w dol przez **props**, mamy jedno zrodlo prawdy -
wpisanie klucza w jednej zakladce dziala w drugiej. To wzorzec **"lifting state up"**.

App przekazuje do zakladek zarowno wartosci (`figmaFileKey`), jak i funkcje zmieniajace
(`setFigmaFileKey`), dzieki czemu pola formularzy moga edytowac wspolny stan.

---

## 6. Warstwa API (folder `api/`)

### 6.1. `figmaApi.js` - rozmowa z REST API Figmy

Trzy glowne funkcje:

- **`fetchFigmaVariables(fileKey, token)`** (zakladka 1)
  - Najpierw probuje endpoint `GET /v1/files/{key}/variables/local` (zmienne designu - dostepne
    na kontach platnych).
  - Jesli Figma odpowie `403` (konto darmowe nie ma tego API) - **automatycznie przechodzi na
    fallback** `fetchFigmaStylesFallback`, ktory pobiera caly plik i wyciaga kolory z warstw.
  - Obsluguje `429` (za duzo zapytan) - czeka 5 s i probuje ponownie, do 3 razy.
  - Zwraca liste tokenow: nazwa, kolekcja, wartosc (np. `#ff0000`) i gotowa nazwa zmiennej CSS.

- **`fetchFigmaStylesFallback(fileKey, token)`**
  - Pobiera `GET /v1/files/{key}` i przez `extractColorsFromNodes` zbiera unikalne kolory
    z warstw (max 20), tworzac z nich tokeny.

- **`fetchFigmaDocument(fileKey, token)`** (zakladka 3)
  - Pobiera caly dokument pliku - potrzebny do parsowania ramek do HTML.

**`figmaCache` (Map)** - prosty cache w pamieci: te same dane nie sa pobierane drugi raz
w trakcie jednej sesji przegladarki. To oszczedza limit zapytan Figmy.

Autoryzacja: naglowek **`X-Figma-Token`** (tak wymaga Figma).

### 6.2. `geminiApi.js` - rozmowa z modelem AI (zakladka 2)

- **`compileDesignImage(base64, mimeType, apiKey)`** - glowna funkcja.
  - Usuwa prefix `data:image/...;base64,` (Gemini chce czysty Base64).
  - Buduje **prompt** (instrukcje po polsku) z zasadami: czysty HTML5 + Vanilla CSS,
    normalny przeplyw (flexbox/grid), dokladne kolory, jeden kontener `.page-wrapper`.
  - Wysyla obraz + prompt przez `fetch` i **wymusza format odpowiedzi JSON** przez
    `responseMimeType: 'application/json'` oraz `responseSchema` (`{ explanation, html, css }`).
    Dzieki temu model nie zwraca "gadki", tylko gotowy obiekt.
  - **Lista modeli** (`GEMINI_MODELS`): jesli pierwszy model wyczerpie dzienny limit (`429`),
    kod automatycznie probuje kolejny.
  - Funkcje pomocnicze `stripFences`, `normalizeHtml`, `normalizeCss` **czyszcza** odpowiedz:
    usuwaja bloki ```` ``` ````, tagi `<html>/<head>/<body>/<style>` - tak, by do podgladu
    trafil czysty fragment HTML i osobno czysty CSS.

**Dlaczego model Vision a nie zwykly?** Bo musi "zobaczyc" obraz makiety - dlatego
wysylamy obrazek jako `inlineData`.

---

## 7. Warstwa narzedzi (folder `utils/`)

### 7.1. `figmaColors.js` - kolory

Figma trzyma kolory jako liczby 0-1 (r, g, b, a). Funkcje:
- `figmaColorToHex` -> `#rrggbb` (lub `#rrggbbaa` przy przezroczystosci),
- `figmaColorToCSS` -> `rgb()` / `rgba()`,
- `getFirstSolidFill` -> pierwszy kolor wypelnienia typu SOLID,
- `extractColorsFromNodes` -> rekurencyjnie zbiera kolory z calego drzewa (uzywane w fallbacku).

### 7.2. `figmaParser.js` - zamiana wezlow Figmy na HTML/CSS (bez AI)

To "silnik" zakladki 3.

- **`convertFrameToCode(frame)`** - punkt wejscia. Tworzy kontener `.figma-frame`
  o wymiarach ramki i uruchamia rekurencje po dzieciach. Zwraca
  `{ html, css, width, height, frameName }`.
- **`figmaNodeToCode(node, parent, cssArr, counter)`** - rekurencyjnie zamienia kazdy wezel:
  - **O pozycjonowaniu dziecka decyduje RODZIC** (kluczowa zasada):
    - rodzic z **auto-layoutem** -> dziecko **plynie** we flexie (`position: relative`),
      a rodzic dostaje `display:flex`, `gap`, `padding`, wyrownanie,
    - rodzic **bez** auto-layoutu -> dziecko **absolutne** (`left`/`top` liczone z
      `absoluteBoundingBox` wzgledem rodzica).
  - **Tekst** (`TEXT`) -> `<p>` z font-size, waga, kolor, line-height; tekst jest
    bezpiecznie kodowany (`&`, `<`, `>`), a `\n` zamieniane na `<br>`.
  - **Kontenery** (FRAME/GROUP/RECTANGLE/ELLIPSE) -> `<div>` z tlem, zaokragleniem,
    obramowaniem (stroke), przezroczystoscia.
  - `counter` daje unikalne nazwy klas (`n0`, `n1`, ...), a reguly CSS sa zbierane do `cssArr`.

**Dlaczego "rodzic decyduje"?** Bo to wlasnie rodzic-flexbox ustawia dzieci. Gdyby kazde
dziecko decydowalo samo, padding/gap/wyrownanie auto-layoutu bylyby ignorowane.

### 7.3. `renderIframeSrc.js` - bezpieczny podglad

Skleja kompletny dokument HTML (`<!DOCTYPE>...<style>${css}</style>...${html}`) do
wstawienia w atrybut `srcDoc` elementu `<iframe>`. Dodaje minimalny **reset CSS** i
zabezpieczenie przed poziomym wychodzeniem tresci poza ramke.

**Dlaczego iframe?** Bo wygenerowany kod jest renderowany **w izolacji** - jego style nie
"wyciekaja" do reszty aplikacji, a aplikacja nie wplywa na podglad. Atrybut
`sandbox="allow-scripts"` dodatkowo izoluje tresc (brak dostepu do naszej strony).

---

## 8. Komponenty (folder `components/`)

Wszystkie zakladki maja podobny schemat: **panel po lewej** (ustawienia/akcje) i
**panel po prawej** (wyniki). Wykorzystywane wzorce React:
- `useState` - stan (status, bledy, wyniki, wpisane dane),
- `useRef` - referencja do ukrytego `<input type="file">` (zakladka 2),
- **renderowanie warunkowe** - `status` (`idle/loading/success/error`) decyduje, co pokazac,
- **listy z `key`** - mapowanie tablic (tokeny, ramki, linie kodu) na elementy.

### 8.1. `TabTokens.jsx` (zakladka 1)
Formularz (File Key + Token) -> `fetchFigmaVariables` -> siatka kafelkow z kolorami +
wygenerowany blok `:root { --... }`. `generateCSSVariables` buduje tekst CSS z listy tokenow.

### 8.2. `TabCompiler.jsx` (zakladka 2)
Wgranie obrazka (`FileReader` -> Base64) -> `compileDesignImage` -> **porownanie**:
po lewej oryginalna makieta, po prawej podglad wygenerowanego kodu w `<iframe>`. Pod
spodem opis od AI i kod w `CodeViewer`.

### 8.3. `TabFigmaHTML.jsx` (zakladka 3)
- Pola File Key + Token (**wspoldzielone** z zakladka 1).
- "Pobierz ramki" -> `fetchFigmaDocument` -> funkcja `walk` przechodzi przez kontenery
  (CANVAS/SECTION/GROUP) i zbiera ekrany (FRAME).
- Wybor ramki z listy -> "Generuj" -> `convertFrameToCode` -> podglad (skalowany iframe,
  przewijalny) + kod w `CodeViewer`.

### 8.4. `CodeViewer.jsx` (wspolny podglad kodu)
Jeden komponent uzywany we wszystkich zakladkach. Co daje:
- **zakladki plikow** (np. `component.html` / `component.css`),
- **numery linii** (przyklejone do lewej przy poziomym przewijaniu),
- **Kopiuj** (do schowka przez `navigator.clipboard`),
- **Pobierz** (zapis pliku przez `Blob` + tymczasowy link `<a download>`).

**Dlaczego osobny komponent?** Zeby nie powtarzac tego samego kodu w trzech miejscach
(zasada DRY) i miec spojny wyglad.

---

## 9. Style (`App.css`, `index.css`)

- `index.css` - globalny reset (`html, body, #root`).
- `App.css` - wszystkie style aplikacji (naglowek, zakladki, karty, formularze, siatka
  tokenow, podglad, `CodeViewer`).

**Wazna poprawka:** elementy siatki (`.grid-container`, `.split-preview`) maja
`min-width: 0`. Bez tego dlugie linie kodu w podgladzie **rozpychaly kolumne i lamaly
uklad calej strony** (pojawial sie poziomy scroll). To czesty problem CSS Grid -
domyslnie kolumna nie zweza sie ponizej rozmiaru tresci.

---

## 10. Bezpieczenstwo i ograniczenia

- **Klucze API** sa wpisywane w przegladarce i nie sa nigdzie zapisywane na stale
  (poza ewentualnym plikiem `.env` przy developmencie). W realnej produkcji zapytania
  do Figmy/Gemini powinny isc przez wlasny backend, zeby nie ujawniac kluczy.
- **Podglad w `<iframe sandbox>`** izoluje wygenerowany kod od aplikacji.
- **Limity** darmowych planow (Figma `429`, Gemini dzienny limit) sa obslugiwane
  (ponawianie / przelaczanie modeli), ale moga ograniczac liczbe zapytan.
- Parser pokrywa najczestsze przypadki (tekst, ksztalty, kolory, auto-layout). Nie
  renderuje obrazow z wypelnien typu IMAGE ani zlozonych efektow.

---

## 11. Jak podpiac Figme do kodu - podsumowanie metod

1. **REST API + zmienne CSS** (zakladka 1) - dane projektowe (kolory) jako tokeny CSS.
2. **Model AI Vision** (zakladka 2) - zrzut ekranu -> HTML/CSS.
3. **REST API + wlasny parser** (zakladka 3) - struktura ramki -> HTML/CSS bez AI.

Rozszerzenia (opisane w `README.md`): **Figma Dev Mode MCP** (dane ramki dla asystenta AI
w edytorze) oraz **CLI / skrypt Node** (ten sam endpoint Figmy + `convertFrameToCode`
uruchomione poza przegladarka).

---

## 12. Skrypty

```bash
npm install      # instalacja zaleznosci
npm run dev      # serwer deweloperski (HMR)
npm run build    # build produkcyjny do folderu dist/
npm run lint     # sprawdzenie kodu (oxlint)
```
