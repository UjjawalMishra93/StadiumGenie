# StadiumGenie — FIFA World Cup 2026 Smart Stadium AI

> **Challenge: Smart Stadiums & Tournament Operations**
> Built for PromptWars Hackathon · Powered by Google Gemini

## What it does

StadiumGenie is a **Gemini-powered fan concierge and ops copilot** for FIFA World Cup 2026 stadiums.

| User | Feature |
|------|---------|
| Fan | Multilingual AI chat (any language, auto-detected) |
| Fan | Live crowd map with zone occupancy |
| Fan | Smart transport advisor with sustainability CO₂ ratings |
| Fan | One-tap accessibility mode + assistance requests |
| Staff / Volunteer | Ops console: crowd alerts, incoming requests, broadcast drafts |
| Staff / Volunteer | Real-time decision-support alerts (`/api/dashboard/alerts`) |

## Problem Statement Coverage

All 8 pillars from the FIFA WC 2026 Smart Stadium problem statement are implemented:

| Pillar | Implementation | File(s) |
|--------|---------------|---------|
| **Navigation** | Gemini concierge answers step-by-step directions grounded in venue facts JSON | `services/gemini.js`, `data/venue-facts.json` |
| **Crowd Management** | Live zone occupancy simulation with diurnal pattern; AI crowd summary every 90s | `services/mockFeed.js`, `routes/dashboard.js` |
| **Accessibility** | WCAG 2.1 AA high-contrast mode, aria-live regions, audio read-out, assistance request form with AI volunteer brief | `components/Accessibility/`, `routes/assist.js` |
| **Transportation** | Transport advisor with simulated ETAs; metro always surfaced first | `components/Transport/TransportAdvisor.jsx` |
| **Sustainability** | Dedicated CO₂ service with EU EEA emission data; `/api/sustainability` endpoint ranks all modes; AI prompt includes CO₂ context | `services/sustainability.js`, `routes/sustainability.js` |
| **Multilingual Assistance** | Gemini auto-detects user language and replies in it; explicit language override supported; broadcast translated into EN/ES/FR/AR | `services/gemini.js`, `routes/broadcast.js` |
| **Operational Intelligence** | Ops Console aggregates live zone data, assistance requests, and AI broadcast drafts for staff | `pages/OpsConsole.jsx`, `routes/metrics.js` |
| **Real-time Decision Support** | `/api/dashboard/alerts` endpoint flags zones ≥85% occupancy with severity levels and recommended staff actions | `routes/dashboard.js` |

## Architecture

```
Frontend (React + Vite + Tailwind CSS)
    Fan App:    Concierge │ Crowd Map │ Transport │ Accessibility │ About
    Ops View:   Live Map  │ Requests  │ Broadcast Box
         ↕  REST + SSE (Server-Sent Events)
Backend (Node.js + Express)
    /api/chat           → Gemini streaming (SSE)
    /api/dashboard      → Mock feed + AI crowd summary
    /api/dashboard/alerts → Real-time decision-support alerts
    /api/assist         → Accessibility assistance requests (in-memory)
    /api/broadcast      → Multilingual Gemini announcements
    /api/metrics        → Latency, tokens, cache stats
    /api/sustainability → CO₂ transport rankings (EU EEA data)
         ↕
Gemini API (Google AI Studio)
    Model: gemini-2.0-flash (server-side only, never exposed to browser)
```

## Real vs. Simulated

| Feature | Status |
|---------|--------|
| Gemini AI responses | ✅ Real |
| Multilingual translation | ✅ Real |
| Venue knowledge base | ✅ Real (static JSON) |
| Sustainability CO₂ data | ✅ Real (EU EEA 2023 averages) |
| Crowd / zone occupancy | 🟡 Simulated (setInterval generator) |
| Transit ETAs | 🟡 Simulated (seeded table) |
| Incident alerts | 🟡 Simulated (random spikes) |

Simulated data is clearly labeled **"Simulated Data"** in the UI.

## Setup

### Prerequisites
- Node.js 18+
- Google AI Studio API key → [Get one here](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key
npm install
npm run dev
# → Running on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

## Judging Criteria Coverage

| Parameter | Implementation |
|-----------|---------------|
| Code Quality | Layered architecture (UI/routes/services/data), named constants (no magic numbers), JSDoc on all exports, ESLint flat config 0 errors, centralized config with input validation |
| Security | API key server-side only, `helmet.js` HTTP headers, input sanitization on ALL write endpoints (chat + broadcast), rate limiting |
| Efficiency | LRU cache with hit/miss tracking, SSE streaming, compact system prompts, `chatLogs` capped at 500 entries |
| Testing | 30+ passing Jest unit + integration tests across 9 test files, including unit tests for sanitizeString and sustainability CO₂ calculations |
| Accessibility | WCAG 2.1 AA contrast, aria-live regions, audio read-out, keyboard navigation, high-contrast mode |
| Alignment | All 8 problem statement pillars implemented (see table above) |

## Run Tests

```bash
cd backend
npm test
```

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS 3
- **Backend**: Node.js + Express + ESM modules
- **AI**: Google Gemini (`@google/generative-ai`)
- **Caching**: `lru-cache`
- **Rate limiting**: `express-rate-limit`
- **Testing**: Jest + Supertest
