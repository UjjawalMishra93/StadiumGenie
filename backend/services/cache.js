import { LRUCache } from 'lru-cache';
import { config } from '../config/env.js';

const cache = new LRUCache({
  max: 200,
  ttl: config.cacheTtlMs,
});

/** Returns a normalized cache key from the last user message + language */
export function buildCacheKey(userMessage, language) {
  return `${language}:${userMessage.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

let hits = 0;
let misses = 0;

export function getCached(key) {
  const val = cache.get(key);
  if (val !== undefined) {
    hits++;
  } else {
    misses++;
  }
  return val;
}

export function setCached(key, value) {
  cache.set(key, value);
}

export function getCacheStats() {
  const total = hits + misses;
  return {
    size: cache.size,
    hits,
    misses,
    hitRate: total > 0 ? parseFloat(((hits / total) * 100).toFixed(1)) : 0,
  };
}
