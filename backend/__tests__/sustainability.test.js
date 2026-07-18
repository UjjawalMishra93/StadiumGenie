import {
  calculateCO2,
  getTransportRankings,
  TRANSPORT_EMISSIONS_G_PER_KM,
} from '../services/sustainability.js';

describe('calculateCO2', () => {
  it('should return zero saved emissions for the car (baseline) mode', () => {
    const result = calculateCO2('car', 10);
    expect(result.savedG).toBe(0);
    expect(result.savedPct).toBe(0);
  });

  it('should calculate correct emissions for metro over 10 km', () => {
    const result = calculateCO2('metro', 10);
    // metro = 14g/km × 10 = 140g
    expect(result.emissionsG).toBe(140);
  });

  it('should report metro as saving >90% vs car', () => {
    const result = calculateCO2('metro', 25);
    expect(result.savedPct).toBeGreaterThanOrEqual(90);
  });

  it('should never return negative savedG', () => {
    // Car vs car baseline should give 0, not negative
    const result = calculateCO2('car', 50);
    expect(result.savedG).toBeGreaterThanOrEqual(0);
  });

  it('should use car emissions as fallback for unknown mode', () => {
    const result = calculateCO2('helicopter', 10);
    const carResult = calculateCO2('car', 10);
    expect(result.emissionsG).toBe(carResult.emissionsG);
  });

  it('should scale emissions linearly with distance', () => {
    const r10 = calculateCO2('bus', 10);
    const r20 = calculateCO2('bus', 20);
    expect(r20.emissionsG).toBe(r10.emissionsG * 2);
  });
});

describe('getTransportRankings', () => {
  it('should return one entry for every mode in TRANSPORT_EMISSIONS_G_PER_KM', () => {
    const rankings = getTransportRankings(20);
    expect(rankings.length).toBe(Object.keys(TRANSPORT_EMISSIONS_G_PER_KM).length);
  });

  it('should sort rankings from lowest to highest emissions', () => {
    const rankings = getTransportRankings(20);
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i].emissionsG).toBeGreaterThanOrEqual(rankings[i - 1].emissionsG);
    }
  });

  it('should assign "excellent" ecoRating to metro', () => {
    const rankings = getTransportRankings(20);
    const metro = rankings.find(r => r.mode === 'metro');
    expect(metro.ecoRating).toBe('excellent');
  });

  it('should assign "poor" ecoRating to car', () => {
    const rankings = getTransportRankings(20);
    const car = rankings.find(r => r.mode === 'car');
    expect(car.ecoRating).toBe('poor');
  });
});
