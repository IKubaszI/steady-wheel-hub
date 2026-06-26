# Kompilator Figma-to-Code

Prosta aplikacja React + Vite, ktora pokazuje **jak podpiac Figme / designy do kodu**.
Aplikacja laczy sie z Figma bezposrednio z przegladarki (REST API) oraz z modelem
AI (Google Gemini Vision) i zamienia projekt na czysty kod HTML/CSS.

Aplikacja ma trzy zakladki - kazda to inny sposob "design -> kod":

| Zakladka | Sposob polaczenia | Co robi |
|----------|-------------------|---------|
| **1. Tokeny z Figmy** | Figma REST API (Variables / Files) | Pobiera kolory i zmienne z pliku i zamienia je na zmienne CSS (`:root { --... }`). |
| **2. AI Kompilator Designu** | Model AI (Gemini Vision) | Wysyla zrzut ekranu makiety do AI i dostaje gotowy HTML + CSS. |
| **3. Figma do HTML** | Figma REST API + wlasny parser | Pobiera strukture ramki i zamienia wezly Figmy na HTML + CSS (bez AI). |

---

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja wystartuje pod adresem, ktory wypisze Vite (domyslnie `http://localhost:5173`).

### Klucze (opcjonalnie przez `.env`)

Klucze mozna wpisac recznie w interfejsie albo ustawic w pliku `.env`:

```bash
VITE_FIGMA_FILE_KEY=...   # klucz pliku z URL Figmy
VITE_FIGMA_PAT=figd_...   # Personal Access Token (Figma -> Settings -> Personal access tokens)
VITE_GEMINI_API_KEY=...   # klucz z https://aistudio.google.com/app/apikey
```

**File Key** bierzemy z adresu pliku Figmy:
`https://www.figma.com/design/<FILE_KEY>/Nazwa-pliku`.

---

## Jak to dziala (3 sposoby podpiecia designu do kodu)

### 1. Figma REST API -> zmienne CSS (zakladka 1)

Plik [`src/api/figmaApi.js`](src/api/figmaApi.js) wola endpoint
`GET /v1/files/{key}/variables/local` (konta platne). Na kontach darmowych Figma
zwraca `403`, wiec automatycznie przelaczamy sie na `GET /v1/files/{key}` i wyciagamy
kolory bezposrednio z warstw ([`src/utils/figmaColors.js`](src/utils/figmaColors.js)).
Kazdy kolor staje sie zmienna CSS.

### 2. Model AI (Gemini Vision) -> HTML/CSS (zakladka 2)

Plik [`src/api/geminiApi.js`](src/api/geminiApi.js) wysyla zrzut ekranu (Base64) do
Gemini z precyzyjnym promptem i wymuszonym schematem odpowiedzi JSON
(`{ explanation, html, css }`). Gdy model osiagnie dzienny limit (`429`), kod sam
probuje kolejny model z listy. Odpowiedz jest czyszczona (usuniecie blokow ```` ``` ````,
tagow `<html>/<body>/<style>`) i renderowana w bezpiecznej, izolowanej ramce `<iframe>`.

### 3. Wlasny parser ramki (zakladka 3)

Plik [`src/utils/figmaParser.js`](src/utils/figmaParser.js) chodzi rekurencyjnie po
drzewie wezlow ramki i generuje HTML + CSS **bez AI**:

- O pozycjonowaniu dziecka decyduje **rodzic**: rodzic z auto-layoutem -> dziecko plynie
  we flexboxie (`gap`, `padding`, wyrownanie); rodzic bez auto-layoutu -> dziecko jest
  ustawiane absolutnie (`left`/`top` liczone z `absoluteBoundingBox`).
- Tekst, kolory, obramowania, zaokraglenia i przezroczystosc sa przepisywane 1:1.

---

## Inne sposoby podpiecia Figmy do kodu (rozszerzenia)

Ta aplikacja korzysta z REST API i modelu AI, bo dziala to w 100% w przegladarce.
Te same dane mozna jednak pobrac takze przez:

- **Figma MCP (Model Context Protocol)** - oficjalny *Figma Dev Mode MCP Server*
  udostepnia zaznaczona ramke asystentowi AI (np. w Cursorze) jako narzedzie.
  Asystent prosi MCP o dane wezla i generuje kod w edytorze. To wariant tej samej
  idei co zakladka 3, tylko po stronie IDE zamiast przegladarki.
- **CLI / skrypt Node** - ten sam endpoint `GET /v1/files/{key}` mozna zawolac
  z linii polecen (`curl` lub maly skrypt `node`) i przepuscic JSON przez
  `convertFrameToCode()` z [`src/utils/figmaParser.js`](src/utils/figmaParser.js),
  zapisujac gotowy HTML/CSS do pliku. Logika parsera jest celowo czysta (bez React),
  zeby dalo sie jej uzyc poza przegladarka.

---

## Struktura projektu

```
src/
  api/
    figmaApi.js          # REST API Figmy (tokeny + dokument)
    geminiApi.js         # AI Gemini Vision (obraz -> HTML/CSS)
  utils/
    figmaColors.js       # konwersja kolorow Figma -> CSS
    figmaParser.js       # parser wezlow Figmy -> HTML/CSS
    renderIframeSrc.js   # budowanie dokumentu do podgladu w <iframe>
  components/
    TabTokens.jsx        # zakladka 1
    TabCompiler.jsx      # zakladka 2
    TabFigmaHTML.jsx     # zakladka 3
  App.jsx / App.css      # uklad i style
```
