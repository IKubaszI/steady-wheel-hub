# Steady Wheel Hub

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
