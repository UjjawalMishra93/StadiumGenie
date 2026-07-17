import { buildSystemPrompt } from '../services/gemini.js';

const mockVenueFacts = [
  { id: 'vf_gate_a', type: 'gate', name: 'Gate A', zone: 'north', description: 'North entry', coordinates: {}, languagesSupported: ['en'] },
];

const mockZoneStatuses = [
  { zoneId: 'z1', name: 'North Stand', capacity: 8000, occupancyPct: 92, lastIncident: { message: 'Crowd surge' }, updatedAt: new Date().toISOString() },
  { zoneId: 'z2', name: 'South Stand', capacity: 9000, occupancyPct: 60, lastIncident: null, updatedAt: new Date().toISOString() },
];

describe('buildSystemPrompt', () => {
  it('should include StadiumGenie identity', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses);
    expect(prompt).toContain('StadiumGenie');
  });

  it('should include venue facts in the prompt', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses);
    expect(prompt).toContain('Gate A');
  });

  it('should highlight high-crowd zones', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses);
    expect(prompt).toContain('North Stand');
    expect(prompt).toContain('92%');
  });

  it('should NOT include low-crowd zones in live status', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses);
    // South Stand at 60% should not appear in high crowd section
    expect(prompt).not.toContain('South Stand: 60');
  });

  it('should include accessibility note when mode is enabled', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses, 'auto', true);
    expect(prompt).toContain('short, simple sentences');
  });

  it('should not include accessibility note in normal mode', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses, 'auto', false);
    expect(prompt).not.toContain('short, simple sentences');
  });

  it('should override language rule when explicit language is provided', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses, 'Hindi', false);
    expect(prompt).toContain('Always reply in the requested language: Hindi');
  });

  it('should include FIFA World Cup 2026 framing', () => {
    const prompt = buildSystemPrompt(mockVenueFacts, mockZoneStatuses);
    expect(prompt).toContain('FIFA World Cup 2026');
  });
});
