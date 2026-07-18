import express from 'express';
import { getTransportRankings, calculateCO2, TRANSPORT_EMISSIONS_G_PER_KM } from '../services/sustainability.js';

const router = express.Router();

/** Default stadium-to-city-centre distance used when no distanceKm is provided. */
const DEFAULT_DISTANCE_KM = 25;

/**
 * GET /api/sustainability
 * Returns CO₂ emission rankings for all transport modes for a given trip distance.
 * Supports an optional `?distanceKm=<number>` query param (defaults to 25 km).
 *
 * This endpoint fulfils the Sustainability pillar of the FIFA World Cup 2026
 * Smart Stadiums problem statement.
 */
router.get('/', (req, res) => {
  const rawDist = parseFloat(req.query.distanceKm);
  const distanceKm = (!Number.isNaN(rawDist) && rawDist > 0) ? rawDist : DEFAULT_DISTANCE_KM;

  const rankings = getTransportRankings(distanceKm);
  const bestMode = rankings[0];
  const carEmissions = calculateCO2('car', distanceKm);

  res.json({
    distanceKm,
    rankings,
    summary: {
      bestMode: bestMode.mode,
      bestModeEmissionsG: bestMode.emissionsG,
      carEmissionsG: carEmissions.emissionsG,
      maxSavedG: carEmissions.emissionsG - bestMode.emissionsG,
      recommendation: `Take the metro — saves ${bestMode.savedPct}% CO₂ vs driving (${bestMode.savedG}g saved over ${distanceKm}km).`,
    },
    emissionsReference: TRANSPORT_EMISSIONS_G_PER_KM,
    source: 'EU EEA 2023 — grams CO₂ per passenger-kilometre',
    generatedAt: new Date().toISOString(),
  });
});

export default router;
