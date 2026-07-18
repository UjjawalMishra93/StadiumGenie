import 'dotenv/config';

/**
 * Parses an environment variable as a positive integer.
 * Falls back to `defaultVal` and logs a warning if the value is absent or invalid.
 *
 * @param {string} name - The environment variable name.
 * @param {number} defaultVal - The fallback value if parsing fails.
 * @returns {number} A valid positive integer.
 */
function parsePositiveInt(name, defaultVal) {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return defaultVal;
  const val = parseInt(raw, 10);
  if (Number.isNaN(val) || val <= 0) {
    console.warn(`[config] ${name} has invalid value ("${raw}") — using default ${defaultVal}`);
    return defaultVal;
  }
  return val;
}

export const config = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  modelName: process.env.MODEL_NAME || 'gemini-2.0-flash',
  feedRefreshIntervalMs: parsePositiveInt('FEED_REFRESH_INTERVAL_MS', 8000),
  cacheTtlMs: parsePositiveInt('CACHE_TTL_MS', 60000),
  rateLimitWindowMs: parsePositiveInt('RATE_LIMIT_WINDOW_MS', 60000),
  rateLimitMax: parsePositiveInt('RATE_LIMIT_MAX', 20),
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.geminiApiKey) {
  console.warn('[config] GEMINI_API_KEY not set — Gemini calls will fail.');
}
