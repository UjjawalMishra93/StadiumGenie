import express from 'express';
import { chatLogs } from '../services/gemini.js';
import { getCacheStats } from '../services/cache.js';

const router = express.Router();

router.get('/', (req, res) => {
  const total = chatLogs.length;
  const avgLatency = total
    ? Math.round(chatLogs.reduce((s, l) => s + l.latencyMs, 0) / total)
    : 0;
  const totalTokens = chatLogs.reduce((s, l) => s + l.promptTokens + l.responseTokens, 0);
  const languageBreakdown = chatLogs.reduce((acc, l) => {
    acc[l.language] = (acc[l.language] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalRequests: total,
    avgLatencyMs: avgLatency,
    totalTokensUsed: totalTokens,
    languageBreakdown,
    cacheStats: getCacheStats(),
    recentLogs: chatLogs.slice(-10),
  });
});

export default router;
