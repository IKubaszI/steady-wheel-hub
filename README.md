# Steady Wheel Hub

**Steady Wheel Hub** to intuicyjna aplikacja webowa stworzona z myślą o kierowcach (zarówno prywatnych, jak i prowadzących jednoosobową działalność), służąca do prostego i szybkiego kontrolowania kosztów eksploatacji pojazdów oraz nadzorowania terminów serwisowych.

### Do czego służy i po co powstała?
Aplikacja ma na celu wyeliminowanie skomplikowanych arkuszy kalkulacyjnych oraz papierowych notatek na rzecz jednego, zintegrowanego asystenta mobilnego. Rozwiązuje kluczowe problemy użytkowników takie jak:
* **Przechowywanie dowodów zakupu:** Umożliwia szybkie rejestrowanie kosztów (paliwo, naprawy, opłaty) wraz z możliwością załączenia zdjęcia paragonu (przechowywanego w chmurze Cloudinary).
* **Zarządzanie terminami (OC/przeglądy):** Automatycznie przypomina i ostrzega (za pomocą kodowania kolorystycznego) o nadchodzących oraz przeterminowanych badaniach technicznych, ubezpieczeniach czy wymianach części eksploatacyjnych.
* **Wygoda i mobilność:** Zoptymalizowany pod urządzenia mobilne interfejs pozwala na dodanie nowego wydatku lub sprawdzenie statusu auta w kilkanaście sekund – bezpośrednio na stacji benzynowej lub w warsztacie.

Demo (public): https://ikubaszi.github.io/steady-wheel-hub/

React + Vite application hosted on GitHub Pages, with Firebase used for:
- authentication (email + password)
- user-scoped data storage (Firestore)
- receipt image upload and delivery (Cloudinary)

## Local setup

1. Install dependencies:
   - `npm install`
2. Copy `.env.example` to `.env.local` and fill all `VITE_FIREBASE_*` values.
3. Start development server:
   - `npm run dev`

## Firebase configuration

- Firestore rules: `firestore.rules`
- Firebase hosting/security headers: `firebase.json`

## GitHub Pages deployment

The workflow is in `.github/workflows/deploy.yml` and requires these GitHub repository secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

The workflow enforces:
- `npm run lint`
- `npm run test`
- `npm run build`

## Cloudinary notes

- Upload endpoint is handled in `src/services/cloudinaryService.ts`.
- For production safety, keep the unsigned preset restricted by:
  - allowed formats
  - max file size
  - target folder
  - optional domain restrictions

## Routing on GitHub Pages

SPA deep-link fallback is handled by:
- `public/404.html`
- redirect parsing in `src/main.tsx`

--

## Deployment (quick)

- GitHub Pages (recommended):
   1. Ensure `vite.config.ts` `base` matches `/<repo-name>/` (already set to `/steady-wheel-hub/`).
   2. Push this repo to GitHub and set the default branch to `main`.
   3. The included GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) will build and deploy automatically on push to `main`.

- Firebase Hosting (alternative):
   - `firebase.json` is configured to serve the `dist` directory and rewrite all routes to `index.html` (SPA).
   - Provide Firebase config values in `.env.local` or GitHub Secrets and use CI to run `firebase deploy` with a `FIREBASE_TOKEN` secret.

## Environment

Copy `.env.example` to `.env.local` and fill in your Firebase values for local development. Do not commit secrets.
