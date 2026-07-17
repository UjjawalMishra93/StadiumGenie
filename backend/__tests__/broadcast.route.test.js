import { jest } from '@jest/globals';
import request from 'supertest';

// Mock gemini service
jest.unstable_mockModule('../services/gemini.js', () => ({
  streamChat: jest.fn(async ({ res }) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: 'Stubbed response' })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', latencyMs: 50, promptTokens: 10, responseTokens: 5 })}\n\n`);
    res.end();
    return { text: 'Stubbed response', meta: { latencyMs: 50, promptTokens: 10, responseTokens: 5 } };
  }),
  generateCrowdSummary: jest.fn(async () => 'Stubbed crowd summary'),
  generateAssistBrief: jest.fn(async () => 'Volunteer brief mock'),
  generateBroadcast: jest.fn(async () => ({
    en: 'Stubbed English broadcast',
    es: 'Stubbed Spanish broadcast',
    fr: 'Stubbed French broadcast'
  })),
  chatLogs: []
}));

const { default: app } = await import('../server.js');

describe('Broadcast Announcement API (/api/broadcast)', () => {
  it('should return 400 when staff message is too short or missing', async () => {
    const res = await request(app)
      .post('/api/broadcast')
      .send({ message: 'hey' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('at least 5 characters');
  });

  it('should generate multilingual translations on successful POST', async () => {
    const res = await request(app)
      .post('/api/broadcast')
      .send({
        message: 'Attention fans: Zone 3 is full, please use Gate C.',
        languages: ['en', 'es', 'fr']
      });

    expect(res.status).toBe(200);
    expect(res.body.translations).toBeDefined();
    expect(res.body.translations.en).toBe('Stubbed English broadcast');
    expect(res.body.translations.es).toBe('Stubbed Spanish broadcast');
    expect(res.body.translations.fr).toBe('Stubbed French broadcast');
    expect(res.body.generatedAt).toBeDefined();
  });
});
