import { LRUCache } from 'lru-cache';
import { config } from '../config/env.js';

/** Maximum number of entries held in the response cache. */
const CACHE_MAX_SIZE = 200;

const cache = new LRUCache({
  max: CACHE_MAX_SIZE,
  ttl: config.cacheTtlMs,
});

/**
 * Returns a normalized, lowercase cache key from the last user message + language context.
 *
 * @param {string} userMessage - The raw user message string.
 * @param {string} language - Language/mode context string (e.g. "en_false").
 * @returns {string} Normalized cache key.
 */
export function buildCacheKey(userMessage, language) {
  return `${language}:${userMessage.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

let hits = 0;
let misses = 0;

/**
 * Attempts to retrieve a cached response. Tracks hit/miss stats.
 *
 * @param {string} key - Cache key from `buildCacheKey`.
 * @returns {object|undefined} Cached value, or undefined on a miss.
 */
export function getCached(key) {
  const val = cache.get(key);
  if (val !== undefined) {
    hits++;
  } else {
    misses++;
  }
  return val;
}

/**
 * Stores a response in the LRU cache.
 *
 * @param {string} key - Cache key from `buildCacheKey`.
 * @param {object} value - The response object to cache.
 */
export function setCached(key, value) {
  cache.set(key, value);
}

/**
 * Returns current cache performance statistics.
 *
 * @returns {{ size: number, hits: number, misses: number, hitRate: number }}
 */
export function getCacheStats() {
  const total = hits + misses;
  return {
    size: cache.size,
    hits,
    misses,
    hitRate: total > 0 ? parseFloat(((hits / total) * 100).toFixed(1)) : 0,
  };
}
