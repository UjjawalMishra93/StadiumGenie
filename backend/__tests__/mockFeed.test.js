import { stopMockFeed, getZoneStatuses } from '../services/mockFeed.js';

describe('mockFeed', () => {
  afterEach(() => stopMockFeed());

  it('should return 6 zones', () => {
    const zones = getZoneStatuses();
    expect(zones).toHaveLength(6);
  });

  it('each zone should have required fields', () => {
    const zones = getZoneStatuses();
    zones.forEach(z => {
      expect(z).toHaveProperty('zoneId');
      expect(z).toHaveProperty('name');
      expect(z).toHaveProperty('occupancyPct');
      expect(z).toHaveProperty('capacity');
      expect(z).toHaveProperty('updatedAt');
    });
  });

  it('occupancyPct should be between 0 and 100', () => {
    const zones = getZoneStatuses();
    zones.forEach(z => {
      expect(z.occupancyPct).toBeGreaterThanOrEqual(0);
      expect(z.occupancyPct).toBeLessThanOrEqual(100);
    });
  });

  it('should return a deep copy (immutable external state)', () => {
    const zones = getZoneStatuses();
    zones[0].occupancyPct = 999;
    const zones2 = getZoneStatuses();
    expect(zones2[0].occupancyPct).not.toBe(999);
  });
});
