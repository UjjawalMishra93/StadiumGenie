# StadiumGenie — FIFA World Cup 2026 Smart Stadium AI

> **Challenge 4: Smart Stadiums & Tournament Operations**
> Built for PromptWars Hackathon · Powered by Google Gemini

## What it does

StadiumGenie is a **Gemini-powered fan concierge and ops copilot** for FIFA World Cup 2026 stadiums.

| User | Feature |
|------|---------|
| Fan | Multilingual AI chat (any language, auto-detected) |
| Fan | Live crowd map with zone occupancy |
| Fan | Smart transport advisor with sustainability ratings |
| Fan | One-tap accessibility mode + assistance requests |
| Staff | Ops console: crowd alerts, incoming requests, broadcast drafts |

## Architecture

```
Frontend (React + Vite + Tailwind CSS)
    Fan App:    Concierge │ Crowd Map │ Transport │ Accessibility
    Ops View:   Live Map  │ Requests  │ Broadcast Box
         ↕  REST + SSE (Server-Sent Events)
Backend (Node.js + Express)
    /api/chat       → Gemini streaming (SSE)
    /api/dashboard  → Mock feed + AI crowd summary
    /api/assist     → Assistance requests (in-memory)
    /api/broadcast  → Multilingual Gemini drafts
    /api/metrics    → Latency, tokens, cache stats
         ↕
Gemini API (Google AI Studio)
    Model: gemini-flash-lite-latest (server-side only, never exposed to browser)
```

## Real vs. Simulated

| Feature | Status |
|---------|--------|
| Gemini AI responses | ✅ Real |
| Multilingual translation | ✅ Real |
| Venue knowledge base | ✅ Real (static JSON) |
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
| Code Quality | Layered architecture (UI/routes/services/data), ESLint flat config with **0 errors**, centralized config, clean scaffold |
| Security | API key server-side only, `helmet.js` HTTP headers, input sanitization + client-side HTML escaping, rate limiting |
| Efficiency | In-memory LRU cache, cache hit/miss tracking + hit rate display in MetricsPanel, SSE streaming, compact system prompts |
| Testing | 20 passing Jest unit + integration tests (testing `/api/chat` SSE streams and rate limiters with Supertest), `/docs/test-cases.md` |
| Accessibility | WCAG 2.1 AA compliant contrast (#8A99B5), aria-live regions, audio read-out, keyboard nav, high-contrast mode |
| Alignment | 5+ pillars covered (navigation, crowd, accessibility, transport, multilingual, ops) |

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
