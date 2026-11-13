# DRISHTI — Your AI Visual Companion

**DRISHTI** is a voice-first, screen-reader-first accessibility Progressive Web App (PWA) designed to help blind and low-vision users navigate daily tasks with dignity, transparency, and privacy.

---

## Architecture & Folder Structure

```text
├── server.ts                          # Express full-stack server (Gemini proxy, Google Routes proxy, rate limiter, Vite SSR/static)
├── vite.config.ts                     # Vite + VitePWA (Workbox precaching, NetworkOnly for /api & Supabase, offline.html)
├── public/
│   ├── icon.svg                       # High-contrast brand SVG icon
│   ├── pwa-192x192.png                # Standard 192x192 PWA icon
│   ├── pwa-512x512.png                # Standard 512x512 PWA icon
│   ├── pwa-maskable-512x512.png       # Safe-zone padded maskable icon
│   ├── apple-touch-icon.png           # iOS 180x180 home-screen icon
│   └── offline.html                   # Accessible offline navigation fallback
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Normalized tables (profiles, user_preferences, trusted_contacts, user_consents, document_metadata, usage_events) + RLS
└── src/
    ├── types/drishti.ts               # Shared domain TypeScript interfaces & language codes
    ├── i18n/translations.ts           # Complete English (en), Kannada (kn), and Hindi (hi) localizations
    ├── lib/
    │   ├── supabase.ts                # Optional Supabase client (gracefully falls back to local device mode when unconfigured)
    │   └── offlineDb.ts               # IndexedDB storage for settings, trusted contacts, consents, saved documents, and non-sensitive queued events
    ├── services/
    │   ├── speech.ts                  # Web Speech API synthesis + speech recognition + voice command intent parser
    │   ├── ocr.ts                     # Offline-capable Tesseract.js OCR engine (English, Kannada, Hindi)
    │   ├── colorDetector.ts           # Deterministic offline pixel color naming (EN/KN/HI)
    │   └── apiClient.ts               # Typed client wrappers for server-side Gemini & Navigation endpoints
    ├── hooks/
    │   ├── usePWAInstall.ts           # Install prompt & iOS Safari guidance hook
    │   ├── useOnlineStatus.ts         # Network connectivity & announcement hook
    │   └── useCamera.ts               # Explicit MediaDevices camera stream & frame capture hook
    ├── context/
    │   └── DrishtiContext.tsx         # App-wide settings, language, theme, speech announcements, auth & consents
    ├── components/
    │   ├── Layout.tsx                 # Skip link, accessible top bar, desktop nav rail, mobile thumb bar, live region
    │   ├── AccessibleModal.tsx        # Keyboard-trapped dialog with Escape support
    │   ├── CameraCapturePanel.tsx     # Reusable camera preview + file upload fallback with explicit permission gate
    │   ├── PWAInstallButton.tsx       # In-app install trigger & iOS instruction modal
    │   └── VoiceCommandBar.tsx        # Persistent push-to-talk / text command fallback bar
    └── pages/
        ├── OnboardingPage.tsx         # Language selection, speech speed test, privacy & consent pledges
        ├── AuthPage.tsx               # Sign up, login, password recovery + transparent Local Mode option
        ├── DashboardPage.tsx          # Voice-first launchpad for all assistive modules
        ├── CameraAssistantPage.tsx    # AI scene description with uncertainty & safety disclaimers
        ├── OcrReaderPage.tsx          # Tesseract.js OCR + pause/resume/repeat/speed + Medicine warning
        ├── VoiceAssistantPage.tsx     # Multilingual voice/text conversational assistant + command router
        ├── CurrencyPage.tsx           # Indian Rupee banknote recognizer with tactile verification cues
        ├── NavigationPage.tsx         # GPS coordinates, compass bearing, spoken route steps & location share
        ├── ObjectFinderPage.tsx       # Target everyday object search in captured/live frames
        ├── LearningAssistantPage.tsx  # Document upload/paste, read-aloud & Gemini audio summaries
        ├── SosPage.tsx                # Trusted contacts management & 2-step explicit SOS confirmation
        ├── ToolsPage.tsx              # Offline Color Detector, QR/Barcode Reader & Product Label inspector
        ├── SettingsPage.tsx           # Language, Navy/Light/High-Contrast themes, text scale, voices & privacy controls
        └── HelpPage.tsx               # TalkBack / keyboard tutorial & honest capability boundaries
```

---

## Implemented vs. Credential-Dependent Capabilities

| Feature | Works Offline / Locally | Requires Server Env Key |
| :--- | :--- | :--- |
| Accessible UI, Onboarding, EN/KN/HI Localization | Yes | No |
| Web Speech TTS Playback & Speed/Voice Controls | Yes (Browser SpeechSynthesis) | No |
| Tesseract.js OCR Reader (EN/KN/HI) | Yes (after model weight download/cache) | No |
| Color Detector & QR/Barcode Reader | Yes (Canvas & `BarcodeDetector`) | No |
| Trusted Contacts & Settings Persistence | Yes (IndexedDB) | Optional `VITE_SUPABASE_*` for cloud sync |
| AI Camera Scene Description, Currency, Object Finder, Summarization | No (requires internet) | `GEMINI_API_KEY` |
| Turn-by-Turn Google Routes & Places Search | GPS & Compass work offline; OpenStreetMap Nominatim works online | `GOOGLE_MAPS_API_KEY` for Google Routes API v2 |

---

## Setup & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your server-side keys:
   - `GEMINI_API_KEY`: Enables AI vision, currency estimation, object finding, conversational voice assistant, and learning summaries.
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Enables cloud authentication and PostgreSQL sync.
   - `GOOGLE_MAPS_API_KEY`: Enables Google Routes API v2 & Places API (New) via the `/api/navigation/*` server proxy.
3. **Apply Supabase migrations** (if using Supabase):
   Execute `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
4. **Run in development**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.
5. **Run unit & integration tests**:
   ```bash
   npm test
   ```
6. **Build & run in production**:
   ```bash
   npm run build
   npm start
   ```

---

## PWA Installation & Testing Notes

- **Service Worker & Workbox**: Configured via `vite-plugin-pwa` in `vite.config.ts`. Static assets and app shell are precached; `/api/*` and Supabase network requests strictly use `NetworkOnly` so private user data or camera frames are never cached in shared Workbox caches.
- **Testing Offline Mode**: Open DevTools → Application → Service Workers → check **Offline**, or toggle network connectivity. DRISHTI announces connectivity changes via `aria-live` and speech synthesis and keeps OCR, Color Detector, Playback, and Trusted Contacts available.
- **Android TalkBack**: All controls meet or exceed `44x44px` touch targets, use semantic `<button>`, `<main>`, `<nav>`, and `aria-live` announcements, and avoid visual-only status indicators.
