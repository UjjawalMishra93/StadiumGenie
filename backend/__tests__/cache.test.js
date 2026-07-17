import { buildCacheKey, getCached, setCached } from '../services/cache.js';

describe('cache', () => {
  it('should build consistent cache keys', () => {
    const k1 = buildCacheKey('Where is Gate A?', 'en');
    const k2 = buildCacheKey('Where is Gate A?', 'en');
    expect(k1).toBe(k2);
  });

  it('should normalize whitespace in cache keys', () => {
    const k1 = buildCacheKey('where is  gate a', 'en');
    const k2 = buildCacheKey('where is gate a', 'en');
    expect(k1).toBe(k2);
  });

  it('should differentiate keys by language', () => {
    const k1 = buildCacheKey('Where is Gate A?', 'en');
    const k2 = buildCacheKey('Where is Gate A?', 'es');
    expect(k1).not.toBe(k2);
  });

  it('should return undefined for cache miss', () => {
    const result = getCached('nonexistent_key_xyz');
    expect(result).toBeUndefined();
  });

  it('should store and retrieve cached values', () => {
    const key = buildCacheKey('test question', 'en');
    const value = { text: 'Test answer', meta: { latencyMs: 100 } };
    setCached(key, value);
    expect(getCached(key)).toEqual(value);
  });
});
