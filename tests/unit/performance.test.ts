import { describe, it, expect } from 'vitest';
import { RenderCache } from '../../src/core/performance';
import {
  resolveProcessorOptionsForRender,
  processorOptionsCacheKey,
  renderMarkdown,
} from '../../src/core/processor';

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

  it('should partition by optionsKey and return toc via getEntry', () => {
    const cache = new RenderCache();
    cache.setEntry('# Title', 'opts-a', {
      html: '<h1>A</h1>',
      toc: [{ depth: 1, text: 'Title', id: 'title', children: [] }],
    });
    cache.setEntry('# Title', 'opts-b', {
      html: '<h1>B</h1>',
      toc: [],
    });

    expect(cache.get('# Title', 'opts-a')).toBe('<h1>A</h1>');
    expect(cache.get('# Title', 'opts-b')).toBe('<h1>B</h1>');
    expect(cache.getEntry('# Title', 'opts-a')?.toc[0]?.text).toBe('Title');
    expect(cache.get('# Title')).toBeNull(); // default optionsKey ''
  });
});

describe('resolveProcessorOptionsForRender', () => {
  it('leaves options unchanged when not streaming', () => {
    const opts = resolveProcessorOptionsForRender({ math: false }, false);
    expect(opts.math).toBe(false);
    expect(opts.highlight).toBeUndefined();
  });

  it('forces highlight:false while streaming without mutating input', () => {
    const input = { math: true, highlight: true };
    const opts = resolveProcessorOptionsForRender(input, true);
    expect(opts.highlight).toBe(false);
    expect(opts.math).toBe(true);
    expect(input.highlight).toBe(true);
  });
});

describe('processorOptionsCacheKey', () => {
  it('returns empty string for undefined options', () => {
    expect(processorOptionsCacheKey(undefined)).toBe('');
  });

  it('differs when highlight differs', () => {
    const a = processorOptionsCacheKey({ highlight: true });
    const b = processorOptionsCacheKey({ highlight: false });
    expect(a).not.toBe(b);
  });

  it('returns null when custom plugins are present', () => {
    expect(
      processorOptionsCacheKey({
        remarkPlugins: [() => (tree) => tree],
      }),
    ).toBeNull();
  });
});

describe('mermaid option', () => {
  it('does not emit mermaid-container when mermaid:false', async () => {
    const source = '```mermaid\nflowchart TD\n  A-->B\n```';
    const html = await renderMarkdown(source, { mermaid: false });
    expect(html).not.toContain('mermaid-container');
  });

  it('emits mermaid-container when mermaid defaults to true', async () => {
    const source = '```mermaid\nflowchart TD\n  A-->B\n```';
    const html = await renderMarkdown(source);
    expect(html).toContain('mermaid-container');
  });

  it('does not emit mermaid-container when highlight:false (streaming path)', async () => {
    const source = '```mermaid\nflowchart TD\n  A-->B\n```';
    const html = await renderMarkdown(source, { highlight: false });
    expect(html).not.toContain('mermaid-container');
  });
});

describe('language aliases', () => {
  it('highlights ```js fences (alias → javascript)', async () => {
    const html = await renderMarkdown('```js\nconst x = 1;\n```');
    expect(html).toContain('code-block');
    expect(html).toContain('data-language="js"');
  });
});
