## Instrukcja: szybki audyt Lighthouse / axe

1) Uruchom lokalny serwer (lub użyj publicznego URL demo):

```bash
npm run build
npx serve dist
```

2) W Chrome: Otwórz stronę (lub publiczny URL), otwórz DevTools → Lighthouse. Wybierz 'Mobile' i 'Desktop', zaznacz Accessibility i Performance. Wygeneruj raport i zapisz PDF / screenshot.

3) Alternatywnie użyj rozszerzenia axe lub `npx @axe-core/cli` dla automatycznego raportu.

4) Do repo: dodaj screenshoty/JSON raportu do `design/lighthouse-report/` i krótki komentarz w `design/ux-note.md` o wynikach i ewentualnych krytycznych błędach.
