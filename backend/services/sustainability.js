/**
 * @fileoverview Transport sustainability calculations for FIFA World Cup 2026 stadiums.
 *
 * Provides CO₂ emission comparisons to help fans make eco-friendly travel decisions.
 * Data sourced from EU EEA averages (grams of CO₂ per passenger-kilometre).
 *
 * Problem Statement Pillar: Sustainability
 */

/**
 * CO₂ emissions per passenger-kilometre in grams for each transport mode.
 * Lower is better. Values from EU EEA 2023 averages.
 *
 * @type {Record<string, number>}
 */
export const TRANSPORT_EMISSIONS_G_PER_KM = {
  metro:     14,
  bus:       68,
  rideshare: 158,
  taxi:      189,
  car:       192,
};

/** Baseline mode used to calculate CO₂ saved (driving alone). */
const BASELINE_MODE = 'car';

/**
 * Calculates the CO₂ emissions and savings for a chosen transport mode
 * compared to driving a car alone.
 *
 * @param {keyof TRANSPORT_EMISSIONS_G_PER_KM} mode - The chosen transport mode.
 * @param {number} distanceKm - One-way trip distance in kilometres.
 * @returns {{ emissionsG: number, savedG: number, savedPct: number }}
 *   - `emissionsG`: Grams of CO₂ emitted for the chosen mode.
 *   - `savedG`: Grams of CO₂ saved vs. driving.
 *   - `savedPct`: Percentage of car emissions saved (0–100).
 */
export function calculateCO2(mode, distanceKm) {
  const modeEmissions = TRANSPORT_EMISSIONS_G_PER_KM[mode] ?? TRANSPORT_EMISSIONS_G_PER_KM[BASELINE_MODE];
  const emissionsG = Math.round(modeEmissions * distanceKm);
  const baselineG = Math.round(TRANSPORT_EMISSIONS_G_PER_KM[BASELINE_MODE] * distanceKm);
  const savedG = Math.max(0, baselineG - emissionsG);
  const savedPct = baselineG > 0 ? Math.round((savedG / baselineG) * 100) : 0;
  return { emissionsG, savedG, savedPct };
}

/**
 * Returns all transport options ranked from lowest to highest CO₂ emissions
 * for a given trip distance, with an eco-rating label.
 *
 * @param {number} distanceKm - One-way trip distance in kilometres.
 * @returns {Array<{
 *   mode: string,
 *   emissionsG: number,
 *   savedG: number,
 *   savedPct: number,
 *   ecoRating: 'excellent'|'good'|'moderate'|'poor'
 * }>} Transport options sorted best-to-worst for the environment.
 */
export function getTransportRankings(distanceKm) {
  return Object.keys(TRANSPORT_EMISSIONS_G_PER_KM)
    .map(mode => {
      const co2 = calculateCO2(mode, distanceKm);
      let ecoRating = 'poor';
      if (co2.savedPct >= 90) { ecoRating = 'excellent'; }
      else if (co2.savedPct >= 60) { ecoRating = 'good'; }
      else if (co2.savedPct >= 20) { ecoRating = 'moderate'; }
      return { mode, ...co2, ecoRating };
    })
    .sort((a, b) => a.emissionsG - b.emissionsG);
}
