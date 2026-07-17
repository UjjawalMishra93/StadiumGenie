# StadiumGenie Frontend

This is the React client application for **StadiumGenie** — a smart stadium fan concierge and operations console designed for AT&T Stadium at the FIFA World Cup 2026.

---

## 🚀 Features

- **Concierge**: Real-time streaming chat with a generative AI guide (Server-Sent Events) supporting multilingual assistance, step-by-step navigation, and ticket/event details.
- **Interactive Crowd Map**: A high-fidelity, interactive SVG map of AT&T Stadium with live-updating zone density overlays and staff-triggered incident indicators.
- **Transport Advisor**: Seeded transit schedules showing sustainable routes (e.g., light rail and rideshare) with custom carbon footprints and carbon footprint comparison ratings.
- **Accessibility Console**: One-tap accessibility settings (high-contrast CSS, double font scaling, fully announced aria-live zones, text-to-speech voice readouts) and staff assistance ticket submissions.
- **Operations Dashboard**: Dedicated view for tournament operations staff. Features a live-updating crowd map, incident feed, list of incoming assistance tickets (with auto-generated AI briefs), and a multi-language broadcast draft generator.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 + Vite (fast bundle generation and Hot Module Replacement)
- **Styling**: Tailwind CSS v3 (sleek dark mode design system, WCAG AA compliant text colors)
- **Icons**: Lucide React
- **PWA Ready**: Web App Manifest (`manifest.json`), touch-responsive viewport configurations
- **Linter**: configured with Oxlint for ultra-fast styling and syntax validation (0 warnings, 0 errors)

---

## 📦 Setup & Launch

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set backend URL in `.env` if custom, otherwise defaults to local backend `http://localhost:3001`:
   ```bash
   VITE_API_URL=http://localhost:3001
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Build static client:
   ```bash
   npm run build
   ```
