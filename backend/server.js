import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { startMockFeed } from './services/mockFeed.js';

// Route imports
import chatRouter from './routes/chat.js';
import dashboardRouter from './routes/dashboard.js';
import assistRouter from './routes/assist.js';
import broadcastRouter from './routes/broadcast.js';
import metricsRouter from './routes/metrics.js';
import sustainabilityRouter from './routes/sustainability.js';

const app = express();

// --- Global Middleware ---
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production' ? (process.env.ALLOWED_ORIGIN || '') : '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '16kb' }));

// --- Request logging middleware ---
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// --- Routes ---
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'StadiumGenie API', version: '1.0.0' }));
app.use('/api/chat', chatRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assist', assistRouter);
app.use('/api/broadcast', broadcastRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/sustainability', sustainabilityRouter);

// --- 404 ---
app.use((req, res) => {
  logger.warn({ url: req.url }, 'Route not found');
  res.status(404).json({ error: 'Route not found' });
});

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled server error');
  res.status(500).json({ error: 'Unexpected server error' });
});

// --- Start ---
if (process.env.NODE_ENV !== 'test') {
  startMockFeed();
  app.listen(config.port, () => {
    logger.info({ port: config.port, model: config.modelName, env: config.nodeEnv }, '🏟️  StadiumGenie API started');
  });
}

export default app;
