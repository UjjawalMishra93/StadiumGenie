import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { startMockFeed } from './services/mockFeed.js';

// Route imports
import chatRouter from './routes/chat.js';
import dashboardRouter from './routes/dashboard.js';
import assistRouter from './routes/assist.js';
import broadcastRouter from './routes/broadcast.js';
import metricsRouter from './routes/metrics.js';

const app = express();

// --- Global Middleware ---
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production' ? (process.env.ALLOWED_ORIGIN || '') : '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '16kb' }));

// --- Routes ---
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'StadiumGenie API' }));
app.use('/api/chat', chatRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assist', assistRouter);
app.use('/api/broadcast', broadcastRouter);
app.use('/api/metrics', metricsRouter);

// --- 404 ---
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// --- Start ---
if (process.env.NODE_ENV !== 'test') {
  startMockFeed();
  app.listen(config.port, () => {
    console.log(`\n🏟️  StadiumGenie API running on http://localhost:${config.port}`);
    console.log(`   Model: ${config.modelName}`);
    console.log(`   Env:   ${config.nodeEnv}\n`);
  });
}

export default app;
