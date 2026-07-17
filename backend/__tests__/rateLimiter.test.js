import { jest } from '@jest/globals';
import request from 'supertest';
import { config } from '../config/env.js';

// Mock gemini service before importing server
jest.unstable_mockModule('../services/gemini.js', () => ({
  streamChat: jest.fn(async ({ res }) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write('data: {}\n\n');
    res.end();
    return { text: 'Stubbed response', meta: {} };
  }),
  generateCrowdSummary: jest.fn(async () => 'Stubbed crowd summary'),
  generateBroadcast: jest.fn(async () => ({ en: 'Broadcast text' })),
  generateAssistBrief: jest.fn(async () => 'Assist brief text'),
  chatLogs: []
}));

const { default: app } = await import('../server.js');

describe('Rate Limiter Integration', () => {
  let originalNodeEnv;
  let originalRateLimitMax;

  beforeAll(() => {
    originalNodeEnv = config.nodeEnv;
    originalRateLimitMax = config.rateLimitMax;

    // Force rate limiter to be active and set low threshold
    config.nodeEnv = 'production';
    config.rateLimitMax = 2;
  });

  afterAll(() => {
    // Restore original values
    config.nodeEnv = originalNodeEnv;
    config.rateLimitMax = originalRateLimitMax;
  });

  it('should allow requests within limit and block when exceeded', async () => {
    // Send 20 requests to hit the limit
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/chat')
        .send({ messages: [{ role: 'user', content: `Limiter Test ${i}` }] });
      expect(res.status).toBe(200);
    }

    // Request 21: Exceeded (429)
    const res21 = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Limiter Test 21' }] });
    
    expect(res21.status).toBe(429);
    expect(res21.body.error).toContain('Too many requests');
  });
});
