import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3001,
  geminiApiKey: process.env.GEMINI_API_KEY,
  modelName: process.env.MODEL_NAME || 'gemini-2.0-flash',
  feedRefreshIntervalMs: parseInt(process.env.FEED_REFRESH_INTERVAL_MS || '8000', 10),
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '60000', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.geminiApiKey) {
  console.warn('[config] GEMINI_API_KEY not set — Gemini calls will fail.');
}
