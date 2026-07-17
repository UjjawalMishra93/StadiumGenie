import { jest } from '@jest/globals';
import request from 'supertest';

// Mock gemini service before importing server/app
jest.unstable_mockModule('../services/gemini.js', () => ({
  streamChat: jest.fn(async ({ res }) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: 'Stubbed response' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', latencyMs: 50, promptTokens: 10, responseTokens: 5 })}\n\n`);
    res.end();
    return {
      text: 'Stubbed response',
      meta: { latencyMs: 50, promptTokens: 10, responseTokens: 5 }
    };
  }),
  generateCrowdSummary: jest.fn(async () => 'Stubbed crowd summary'),
  generateBroadcast: jest.fn(async () => ({ en: 'Broadcast text' })),
  generateAssistBrief: jest.fn(async () => 'Assist brief text'),
  chatLogs: []
}));

const { default: app } = await import('../server.js');

describe('POST /api/chat route integration', () => {
  it('should return 400 when messages array is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('messages array is required');
  });

  it('should return 200 and stream SSE data on successful request', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Where is Gate A?' }],
        language: 'en',
        accessibilityMode: false
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('Stubbed response');
    expect(res.text).toContain('done');
  });

  it('should return cached response if request is repeated', async () => {
    // Send first request to populate cache
    await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Unique Question' }]
      });

    // Send second identical request
    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Unique Question' }]
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"cached":true');
  });
});
