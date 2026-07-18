import express from 'express';
import { generateBroadcast } from '../services/gemini.js';
import { broadcastRateLimiter } from '../middleware/rateLimiter.js';
import { sanitizeString } from '../middleware/sanitize.js';
import { BroadcastRequestSchema, validate } from '../config/schemas.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/broadcast
 * Generates a multilingual public announcement from a staff-authored message.
 * Input is validated with Zod and sanitized before forwarding to Gemini.
 */
router.post('/', broadcastRateLimiter, async (req, res) => {
  try {
    const parsed = validate(BroadcastRequestSchema, req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.errors }, 'Invalid broadcast request body');
      return res.status(400).json({ error: parsed.errors.join('; ') });
    }
    const { message, languages } = parsed.data;

    const sanitized = sanitizeString(message);
    logger.info({ languages, messageLength: sanitized.length }, 'Broadcast generation started');

    const translations = await generateBroadcast({
      staffMessage: sanitized,
      targetLanguages: languages,
    });

    logger.info({ languages }, 'Broadcast generated successfully');
    res.json({ translations, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err: err.message }, 'Error in POST /api/broadcast');
    res.status(500).json({ error: 'Failed to generate broadcast' });
  }
});

export default router;
