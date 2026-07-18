import express from 'express';
import { getZoneStatuses } from '../services/mockFeed.js';
import { generateCrowdSummary } from '../services/gemini.js';
import { logger } from '../config/logger.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Delay before the first AI summary is generated, giving the server time to settle. */
const FIRST_SUMMARY_DELAY_MS = 10000;

/** Interval between AI crowd summary refreshes. Conservative to preserve free-tier quota. */
const SUMMARY_REFRESH_INTERVAL_MS = 90000;

/** Zone occupancy percentage that triggers an actionable ops alert. */
const ALERT_THRESHOLD_PCT = 85;

/** Zone occupancy percentage classified as critical (vs. high). */
const CRITICAL_THRESHOLD_PCT = 95;

// ──────────────────────────────────────────────────────────────────────────────

const router = express.Router();

/** Cached AI crowd summary to avoid calling Gemini on every dashboard poll. */
let cachedSummary = { text: 'Loading crowd summary...', updatedAt: null };

/**
 * Fetches fresh zone data and generates a new AI crowd summary.
 * Silently suppresses 429 quota errors to avoid flooding logs.
 */
async function refreshSummary() {
  try {
    const zones = getZoneStatuses();
    const text = await generateCrowdSummary(zones);
    cachedSummary = { text, updatedAt: new Date().toISOString() };
    logger.debug('AI crowd summary refreshed');
  } catch (e) {
    if (!e.message?.includes('429')) {
      logger.warn({ err: e.message }, 'Dashboard summary refresh failed');
    }
  }
}

// Refresh AI summary periodically to conserve free-tier quota
if (process.env.NODE_ENV !== 'test') {
  setTimeout(refreshSummary, FIRST_SUMMARY_DELAY_MS);
  setInterval(refreshSummary, SUMMARY_REFRESH_INTERVAL_MS);
}

/**
 * GET /api/dashboard
 * Returns live zone statuses and the latest AI crowd summary.
 */
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

/**
 * GET /api/dashboard/alerts
 * Returns real-time decision-support alerts for ops staff.
 * Flags any zone above the critical threshold with a recommended action.
 */
router.get('/alerts', (req, res) => {
  const zones = getZoneStatuses();
  const alerts = zones
    .filter(z => z.occupancyPct >= ALERT_THRESHOLD_PCT)
    .map(z => ({
      zoneId: z.zoneId,
      zoneName: z.name,
      occupancyPct: z.occupancyPct,
      severity: z.occupancyPct >= CRITICAL_THRESHOLD_PCT ? 'critical' : 'high',
      action: `Open overflow gates for ${z.name}. Redirect fans to adjacent lower-density zone.`,
      incident: z.lastIncident || null,
      detectedAt: new Date().toISOString(),
    }));

  logger.info({ alertCount: alerts.length }, 'Alerts endpoint polled');
  res.json({
    alerts,
    totalAlerts: alerts.length,
    checkedAt: new Date().toISOString(),
  });
});

export default router;
