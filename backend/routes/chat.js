import express from 'express';
import { createRequire } from 'module';
import { streamChat } from '../services/gemini.js';
import { buildCacheKey, getCached, setCached } from '../services/cache.js';
import { sanitizeChatInput } from '../middleware/sanitize.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { getZoneStatuses } from '../services/mockFeed.js';

const require = createRequire(import.meta.url);
const venueFacts = require('../data/venue-facts.json');

const router = express.Router();

router.post('/', chatRateLimiter, sanitizeChatInput, async (req, res) => {
  try {
    const { messages, language = 'auto', accessibilityMode = false } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const lastMessage = messages[messages.length - 1].content;
    const cacheKey = buildCacheKey(lastMessage, `${language}_${accessibilityMode}`);
    const cached = getCached(cacheKey);

    if (cached) {
      // Return cached response as a single SSE stream
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: cached.text, cached: true })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', ...cached.meta, cached: true })}\n\n`);
      return res.end();
    }

    const zoneStatuses = getZoneStatuses();

    // streamChat writes directly to res via SSE and returns the full text + meta
    const result = await streamChat({ messages, venueFacts, zoneStatuses, language, accessibilityMode, res });
    if (result) {
      setCached(cacheKey, result);
    }

  } catch (err) {
    console.error('[/api/chat]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
