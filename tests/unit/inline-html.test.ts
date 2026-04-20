import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/core/processor';

// ============================================================
// Inline HTML support
// ============================================================
// The processor is configured with `allowHtml: true` + a sanitize
// schema that explicitly permits the `style`, `class`, `id`, and
// `data-*` attributes globally. This suite locks in the contract
// for raw HTML tags (especially sized `<img>`) embedded inside a
// Markdown document so Angus plugin docs can reliably render
// `<img src="..." style="max-width:1024px;..." />` snippets.
// ============================================================

describe('Inline HTML', () => {
  it('renders a raw <img> with style/width/height attributes', async () => {
    const md =
      '<img src="diagrams/svg/02-lifecycle.svg" alt="请求生命周期" width="800" height="400" style="max-width:1024px;width:100%;height:auto;" />';
    const html = await renderMarkdown(md);
    expect(html).toContain('<img');
    expect(html).toContain('src="diagrams/svg/02-lifecycle.svg"');
    expect(html).toContain('alt="请求生命周期"');
    expect(html).toContain('style="max-width:1024px;width:100%;height:auto;"');
    expect(html).toContain('width="800"');
    expect(html).toContain('height="400"');
  });

  it('renders a raw <img> inside a paragraph alongside Markdown text', async () => {
    const md =
      'Before **bold** <img src="a.png" alt="a" style="max-width:200px;" /> after.';
    const html = await renderMarkdown(md);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<img');
    expect(html).toContain('style="max-width:200px;"');
  });

  it('still strips javascript: src from raw <img>', async () => {
    const md = '<img src="javascript:alert(1)" alt="x" />';
    const html = await renderMarkdown(md);
    // Sanitizer drops the dangerous src; tag may remain but without it.
    expect(html).not.toMatch(/src\s*=\s*"javascript:/i);
  });

  it('strips <script> tags from inline HTML', async () => {
    const md = '<script>alert(1)</script><p>safe</p>';
    const html = await renderMarkdown(md);
    expect(html).not.toContain('<script');
    expect(html).toContain('safe');
  });

  it('keeps class attribute on raw HTML blocks', async () => {
    const md = '<div class="callout">hi</div>';
    const html = await renderMarkdown(md);
    expect(html).toContain('<div');
    expect(html).toContain('class="callout"');
  });
});
