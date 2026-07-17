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
  generateBroadcast: jest.fn(async () => ({ en: 'Broadcast mock' })),
  chatLogs: []
}));

const { default: app } = await import('../server.js');

describe('Assistance Requests API (/api/assist)', () => {
  it('should return 400 when missing required fields on POST', async () => {
    const res = await request(app)
      .post('/api/assist')
      .send({ category: 'Other' }); // missing description and location

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('should create assistance request with generated brief on POST', async () => {
    const payload = {
      category: 'Wheelchair Access',
      description: 'Need assistance getting to row B',
      location: 'Section 112'
    };

    const res = await request(app)
      .post('/api/assist')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.request).toBeDefined();
    expect(res.body.request.id).toContain('req_');
    expect(res.body.request.category).toBe(payload.category);
    expect(res.body.request.staffBrief).toBe('Volunteer brief mock');
    expect(res.body.request.status).toBe('open');
  });

  it('should list all requests on GET', async () => {
    const res = await request(app)
      .get('/api/assist');

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeDefined();
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(res.body.requests.length).toBeGreaterThan(0);
  });

  it('should update request status on PATCH', async () => {
    // 1. Create a request first
    const createRes = await request(app)
      .post('/api/assist')
      .send({
        category: 'Medical Support',
        description: 'Feeling dizzy',
        location: 'Gate D'
      });
    const reqId = createRes.body.request.id;

    // 2. Patch status to 'in-progress'
    const patchRes = await request(app)
      .patch(`/api/assist/${reqId}`)
      .send({ status: 'in-progress' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.request.status).toBe('in-progress');

    // 3. Patch to invalid status
    const invalidRes = await request(app)
      .patch(`/api/assist/${reqId}`)
      .send({ status: 'invalid-status' });

    expect(invalidRes.status).toBe(400);
  });

  it('should return 404 on PATCH for non-existent request ID', async () => {
    const res = await request(app)
      .patch('/api/assist/req_999999')
      .send({ status: 'resolved' });

    expect(res.status).toBe(404);
  });
});
