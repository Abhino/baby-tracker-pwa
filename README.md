# Baby Log (PWA)

Offline-first baby tracker for a small family. Hosted on GitHub Pages, talks to your Cloud Run API service.
Entries are saved on the phone first and synced in the background, so logging works with no signal.

## Setup

1. **Firebase**: in the Firebase console, add Firebase to your existing Google Cloud project.
   - Authentication → Sign-in method → enable **Google**.
   - Authentication → Settings → Authorized domains → add `<your-user>.github.io`.
   - Project settings → Your apps → add a **Web app** and copy `apiKey`, `authDomain`, `projectId`.
2. **GitHub**: create a public repo, push this folder to `main`.
   - Settings → Pages → Source: **GitHub Actions**.
   - Settings → Secrets and variables → Actions → **Variables** (not secrets) → add:
     `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_API_URL` (your Cloud Run URL).
   - Push again (or run the workflow). The site appears at `https://<user>.github.io/<repo>/`.
3. **API**: set `ALLOWED_ORIGINS=https://<user>.github.io` on the Cloud Run service (see the API repo README).

These values are public by design. The API verifies the Firebase token and the email allowlist on every request.

## Local dev

```
cp .env.example .env.local   # fill in
npm install
npm run dev
```
Add `http://localhost:5173` to `ALLOWED_ORIGINS` on the API while developing.

## Install on phones

- **Android (Chrome)**: menu → Install app.
- **iPhone (Safari)**: Share → Add to Home Screen. Open it from the home screen icon.

## Notes

- Everything is stored in ml, kg, cm and °C; units are only a display setting (Account tab).
- If the Google sign-in popup misbehaves in an iOS home-screen app, sign in once in Safari first, then reopen the app.
