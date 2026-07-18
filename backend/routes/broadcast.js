import express from 'express';
import { generateBroadcast } from '../services/gemini.js';
import { broadcastRateLimiter } from '../middleware/rateLimiter.js';
import { sanitizeString } from '../middleware/sanitize.js';

// ─── Named Constants ───────────────────────────────────────────────────────────

/** Minimum characters required in a staff broadcast message. */
const MIN_MESSAGE_LENGTH = 5;

/** Maximum characters accepted in a staff broadcast message. */
const MAX_MESSAGE_LENGTH = 500;

// ──────────────────────────────────────────────────────────────────────────────

const router = express.Router();

/**
 * POST /api/broadcast
 * Generates a multilingual public announcement from a staff-authored message.
 * Applies the same input sanitization used by the chat endpoint.
 */
router.post('/', broadcastRateLimiter, async (req, res) => {
  try {
    const { message, languages = ['en', 'es', 'fr', 'ar'] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `A staff message of at least ${MIN_MESSAGE_LENGTH} characters is required` });
    }

    const sanitized = sanitizeString(message).slice(0, MAX_MESSAGE_LENGTH);

    const translations = await generateBroadcast({
      staffMessage: sanitized,
      targetLanguages: languages,
    });

    res.json({ translations, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/broadcast]', err.message);
    res.status(500).json({ error: 'Failed to generate broadcast' });
  }
});

export default router;
