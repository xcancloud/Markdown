import { describe, it, expect } from 'vitest';
import { RenderCache } from '../../src/core/performance';

describe('RenderCache', () => {
  it('should cache and retrieve values', () => {
    const cache = new RenderCache();
    cache.set('# Hello', '<h1>Hello</h1>');
    expect(cache.get('# Hello')).toBe('<h1>Hello</h1>');
  });

  it('should return null for missing values', () => {
    const cache = new RenderCache();
    expect(cache.get('missing')).toBeNull();
  });

  it('should evict oldest entries when maxSize exceeded', () => {
    const cache = new RenderCache(2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    // 'a' should be evicted
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  it('should expire entries after TTL', async () => {
    const cache = new RenderCache(100, 50); // 50ms TTL
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get('key')).toBeNull();
  });

  it('should clear all entries', () => {
    const cache = new RenderCache();
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });
});
