import express from 'express';
import { generateBroadcast } from '../services/gemini.js';
import { broadcastRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', broadcastRateLimiter, async (req, res) => {
  try {
    const { message, languages = ['en', 'es', 'fr', 'ar'] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'A staff message of at least 5 characters is required' });
    }

    const translations = await generateBroadcast({
      staffMessage: message.slice(0, 500),
      targetLanguages: languages,
    });

    res.json({ translations, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/broadcast]', err.message);
    res.status(500).json({ error: 'Failed to generate broadcast' });
  }
});

export default router;
