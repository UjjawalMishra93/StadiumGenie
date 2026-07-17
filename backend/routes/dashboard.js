import express from 'express';
import { getZoneStatuses } from '../services/mockFeed.js';
import { generateCrowdSummary } from '../services/gemini.js';



const router = express.Router();

// Cached crowd summary to avoid calling Gemini on every poll
let cachedSummary = { text: 'Loading crowd summary...', updatedAt: null };

async function refreshSummary() {
  try {
    const zones = getZoneStatuses();
    const text = await generateCrowdSummary(zones);
    cachedSummary = { text, updatedAt: new Date().toISOString() };
  } catch (e) {
    // 429 quota: don't flood logs, just keep old summary
    if (!e.message?.includes('429')) {
      console.warn('[dashboard] summary refresh failed:', e.message);
    }
  }
}

// Refresh AI summary every 90s to conserve free-tier quota
if (process.env.NODE_ENV !== 'test') {
  // Delay first call by 10s to let server settle
  setTimeout(refreshSummary, 10000);
  setInterval(refreshSummary, 90000);
}

router.get('/', (req, res) => {
  const zones = getZoneStatuses();
  res.json({
    zones,
    aiSummary: cachedSummary,
    venueName: 'AT&T Stadium — FIFA World Cup 2026',
    simulated: true,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
