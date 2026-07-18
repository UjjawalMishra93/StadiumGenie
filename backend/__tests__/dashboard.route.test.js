import { jest } from '@jest/globals';
import request from 'supertest';

// Mock gemini service before importing server/app
jest.unstable_mockModule('../services/gemini.js', () => ({
  streamChat: jest.fn(async ({ res }) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: 'Stubbed' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', latencyMs: 10, promptTokens: 5, responseTokens: 3 })}\n\n`);
    res.end();
    return { text: 'Stubbed', meta: { latencyMs: 10, promptTokens: 5, responseTokens: 3 } };
  }),
  generateCrowdSummary: jest.fn(async () => 'All zones stable.'),
  generateBroadcast: jest.fn(async () => ({ en: 'Mock broadcast' })),
  generateAssistBrief: jest.fn(async () => 'Mock brief'),
  chatLogs: [],
}));

const { default: app } = await import('../server.js');

describe('GET /api/dashboard', () => {
  it('should return zones and aiSummary', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.zones).toBeDefined();
    expect(Array.isArray(res.body.zones)).toBe(true);
    expect(res.body.aiSummary).toBeDefined();
    expect(res.body.simulated).toBe(true);
  });
});

describe('GET /api/dashboard/alerts', () => {
  it('should return an alerts array', async () => {
    const res = await request(app).get('/api/dashboard/alerts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
    expect(typeof res.body.totalAlerts).toBe('number');
    expect(res.body.checkedAt).toBeDefined();
  });

  it('should include required fields in each alert', async () => {
    const res = await request(app).get('/api/dashboard/alerts');
    for (const alert of res.body.alerts) {
      expect(alert.zoneId).toBeDefined();
      expect(alert.zoneName).toBeDefined();
      expect(alert.occupancyPct).toBeGreaterThanOrEqual(85);
      expect(['high', 'critical']).toContain(alert.severity);
      expect(typeof alert.action).toBe('string');
    }
  });
});

describe('GET /api/sustainability', () => {
  it('should return transport rankings and summary', async () => {
    const res = await request(app).get('/api/sustainability');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.rankings)).toBe(true);
    expect(res.body.rankings.length).toBeGreaterThan(0);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.bestMode).toBe('metro');
  });

  it('should accept a custom distanceKm query param', async () => {
    const res = await request(app).get('/api/sustainability?distanceKm=10');
    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBe(10);
  });

  it('should fall back to default distance for invalid distanceKm', async () => {
    const res = await request(app).get('/api/sustainability?distanceKm=abc');
    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBe(25);
  });
});
