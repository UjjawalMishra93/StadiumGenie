import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Token-bucket rate limiter for Gemini-backed endpoints.
 * Prevents quota exhaustion during a live demo.
 */
export const chatRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a moment before asking again.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
  },
  skip: (_req) => config.nodeEnv === 'test',
});

export const broadcastRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: Math.max(5, Math.floor(config.rateLimitMax / 4)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Broadcast rate limit reached. Wait before sending another.',
  },
  skip: (_req) => config.nodeEnv === 'test',
});
