/**
 * @fileoverview Structured application logger using pino.
 *
 * Replaces ad-hoc `console.log` calls with leveled, structured JSON logging.
 * In development, output is pretty-printed via pino-pretty.
 * In production/test, raw JSON is emitted for ingestion by log aggregators.
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Application-wide structured logger.
 * Use `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`.
 *
 * @example
 * logger.info({ route: '/api/chat', latencyMs: 320 }, 'Chat request completed');
 * logger.error({ err }, 'Unexpected error in gemini service');
 */
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'stadiumgenie-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['req.headers.authorization', 'geminiApiKey'],
      censor: '[REDACTED]',
    },
  },
  isDev
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } })
    : undefined
);
