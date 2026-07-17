import { config } from '../config/env.js';

// Initial zones for AT&T Stadium (FIFA WC2026)
const ZONES = [
  { zoneId: 'zone_north',    name: 'North Stand (101–120)',   capacity: 8000 },
  { zoneId: 'zone_east',     name: 'East Stand (121–140)',    capacity: 7500 },
  { zoneId: 'zone_south',    name: 'South Stand (201–215)',   capacity: 9000 },
  { zoneId: 'zone_west',     name: 'West Premiums (301–320)', capacity: 5000 },
  { zoneId: 'zone_upper_n',  name: 'Upper North (501–520)',   capacity: 6000 },
  { zoneId: 'zone_upper_s',  name: 'Upper South (521–540)',   capacity: 6000 },
];

/** In-memory state */
let zoneStatuses = ZONES.map(z => ({
  ...z,
  occupancyPct: 20 + Math.random() * 15,
  lastIncident: null,
  updatedAt: new Date().toISOString(),
}));

let tickCount = 0;
let feedInterval = null;

/**
 * Diurnal pattern: ramp up from 20% → 95% over ~60 ticks (pre-match),
 * then slowly drop post-match.
 */
function diurnalBase(tick) {
  // Simulate 2-hour pre-match crowd build
  const phase = Math.min(tick / 60, 1);
  return 20 + 70 * Math.pow(phase, 1.5);
}

const INCIDENTS = [
  'Minor crowd surge reported',
  'Lost item found — reporting to staff',
  'Medical assistance requested',
  'Gate queue backing up',
  'Concession spill — cleanup in progress',
];

function generateFeed() {
  tickCount++;
  const base = diurnalBase(tickCount);

  zoneStatuses = ZONES.map((z, i) => {
    // Each zone has slight offsets and noise
    const offset = (i % 3) * 5 - 5;
    const noise = (Math.random() - 0.5) * 12;
    const occupancyPct = Math.min(100, Math.max(5, base + offset + noise));

    // Random incident spike (5% chance per zone per tick)
    let lastIncident = null;
    if (Math.random() < 0.05) {
      lastIncident = {
        message: INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)],
        time: new Date().toISOString(),
        severity: occupancyPct > 85 ? 'high' : 'medium',
      };
    }

    return {
      zoneId: z.zoneId,
      name: z.name,
      capacity: z.capacity,
      occupancyPct: Math.round(occupancyPct * 10) / 10,
      lastIncident,
      updatedAt: new Date().toISOString(),
    };
  });
}

/** Start the simulated feed. Called once at server startup. */
export function startMockFeed() {
  generateFeed(); // immediate first tick
  feedInterval = setInterval(generateFeed, config.feedRefreshIntervalMs);
  console.log(`[mockFeed] Started — refreshing every ${config.feedRefreshIntervalMs}ms`);
}

/** Stop the feed (useful in tests). */
export function stopMockFeed() {
  if (feedInterval) {
    clearInterval(feedInterval);
    feedInterval = null;
  }
}

/** Returns a deep copy of current zone statuses. */
export function getZoneStatuses() {
  return JSON.parse(JSON.stringify(zoneStatuses));
}

/** Returns current tick count (for testing). */
export function getTickCount() {
  return tickCount;
}
