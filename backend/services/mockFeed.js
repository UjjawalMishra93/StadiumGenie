import { config } from '../config/env.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Probability (0–1) that any given zone generates an incident on each feed tick. */
const INCIDENT_PROBABILITY = 0.05;

/** Number of ticks representing the full pre-match crowd build-up phase. */
const PRE_MATCH_TICKS = 60;

/** Minimum possible zone occupancy percentage. */
const MIN_OCCUPANCY_PCT = 5;

/** Maximum possible zone occupancy percentage. */
const MAX_OCCUPANCY_PCT = 100;

/** Occupancy threshold above which an incident is classified as high severity. */
const HIGH_OCCUPANCY_THRESHOLD_PCT = 85;

// ──────────────────────────────────────────────────────────────────────────────

/** Static zone definitions for AT&T Stadium (FIFA WC 2026). */
const ZONES = [
  { zoneId: 'zone_north',    name: 'North Stand (101–120)',   capacity: 8000 },
  { zoneId: 'zone_east',     name: 'East Stand (121–140)',    capacity: 7500 },
  { zoneId: 'zone_south',    name: 'South Stand (201–215)',   capacity: 9000 },
  { zoneId: 'zone_west',     name: 'West Premiums (301–320)', capacity: 5000 },
  { zoneId: 'zone_upper_n',  name: 'Upper North (501–520)',   capacity: 6000 },
  { zoneId: 'zone_upper_s',  name: 'Upper South (521–540)',   capacity: 6000 },
];

/** In-memory state: current occupancy and incident data for each zone. */
let zoneStatuses = ZONES.map(z => ({
  ...z,
  occupancyPct: 20 + Math.random() * 15,
  lastIncident: null,
  updatedAt: new Date().toISOString(),
}));

let tickCount = 0;
let feedInterval = null;

const INCIDENTS = [
  'Minor crowd surge reported',
  'Lost item found — reporting to staff',
  'Medical assistance requested',
  'Gate queue backing up',
  'Concession spill — cleanup in progress',
];

/**
 * Calculates the diurnal occupancy base for a given tick.
 * Simulates a 2-hour pre-match crowd build from 20% → 95%.
 *
 * @param {number} tick - Current tick count since feed start.
 * @returns {number} Base occupancy percentage (20–90 range).
 */
function diurnalBase(tick) {
  const phase = Math.min(tick / PRE_MATCH_TICKS, 1);
  return 20 + 70 * Math.pow(phase, 1.5);
}

/**
 * Advances the simulation by one tick.
 * Applies diurnal occupancy pattern, per-zone noise, and random incident generation.
 */
function generateFeed() {
  tickCount++;
  const base = diurnalBase(tickCount);

  zoneStatuses = ZONES.map((z, i) => {
    // Each zone has slight offsets and noise
    const offset = (i % 3) * 5 - 5;
    const noise = (Math.random() - 0.5) * 12;
    const occupancyPct = Math.min(MAX_OCCUPANCY_PCT, Math.max(MIN_OCCUPANCY_PCT, base + offset + noise));

    // Random incident spike
    let lastIncident = null;
    if (Math.random() < INCIDENT_PROBABILITY) {
      lastIncident = {
        message: INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)],
        time: new Date().toISOString(),
        severity: occupancyPct > HIGH_OCCUPANCY_THRESHOLD_PCT ? 'high' : 'medium',
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

/**
 * Starts the simulated crowd feed. Called once at server startup.
 * Runs an immediate first tick then repeats on the configured interval.
 */
export function startMockFeed() {
  generateFeed(); // immediate first tick
  feedInterval = setInterval(generateFeed, config.feedRefreshIntervalMs);
  console.log(`[mockFeed] Started — refreshing every ${config.feedRefreshIntervalMs}ms`);
}

/**
 * Stops the simulated feed interval. Useful in test environments.
 */
export function stopMockFeed() {
  if (feedInterval) {
    clearInterval(feedInterval);
    feedInterval = null;
  }
}

/**
 * Returns a deep copy of the current zone statuses to prevent external mutation.
 *
 * @returns {Array<object>} Snapshot of zone occupancy data.
 */
export function getZoneStatuses() {
  return JSON.parse(JSON.stringify(zoneStatuses));
}

/**
 * Returns the current tick count. Used for testing and diagnostics.
 *
 * @returns {number} Number of feed ticks elapsed since `startMockFeed`.
 */
export function getTickCount() {
  return tickCount;
}
