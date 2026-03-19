import { describe, it, expect } from 'vitest';
import { renderMarkdown, renderMarkdownSync } from '../../src/core/processor';

describe('Markdown Processor', () => {
  // ============================
  // CommonMark 基础
  // ============================
  describe('CommonMark', () => {
    it('should render headings', async () => {
      const html = await renderMarkdown('# Hello');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello');
    });

    it('should render emphasis and strong', async () => {
      const html = await renderMarkdown('*em* **strong**');
      expect(html).toContain('<em>em</em>');
      expect(html).toContain('<strong>strong</strong>');
    });

    it('should render links with title', async () => {
      const html = await renderMarkdown(
        '[text](https://example.com "title")',
      );
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('title="title"');
    });

    it('should render fenced code blocks', async () => {
      const html = await renderMarkdown('```js\nconst x = 1;\n```');
      expect(html).toContain('code-block');
      expect(html).toContain('data-language="js"');
      expect(html).toContain('const');
    });

    it('should render ordered and unordered lists', async () => {
      const html = await renderMarkdown(
        '- item1\n- item2\n\n1. first\n2. second',
      );
      expect(html).toContain('<ul>');
      expect(html).toContain('<ol>');
    });

    it('should render block quotes', async () => {
      const html = await renderMarkdown('> quote');
      expect(html).toContain('<blockquote>');
    });

    it('should handle nested block quotes', async () => {
      const html = await renderMarkdown('> outer\n>> inner');
      expect(html).toContain('<blockquote>');
    });

    it('should render horizontal rules', async () => {
      const html = await renderMarkdown('---');
      expect(html).toContain('<hr');
    });

    it('should render images', async () => {
      const html = await renderMarkdown('![alt text](image.png "title")');
      expect(html).toContain('<img');
      expect(html).toContain('alt="alt text"');
    });

    it('should render inline code', async () => {
      const html = await renderMarkdown('Use `code` here');
      expect(html).toContain('<code>code</code>');
    });

    it('should render paragraphs', async () => {
      const html = await renderMarkdown('Hello world');
      expect(html).toContain('<p>');
    });

    it('should handle setext headings', async () => {
      const html = await renderMarkdown('Heading\n===');
      expect(html).toContain('<h1');
    });
  });

  // ============================
  // GFM 扩展
  // ============================
  describe('GFM', () => {
    it('should render tables', async () => {
      const md = '| a | b |\n|---|---|\n| 1 | 2 |';
      const html = await renderMarkdown(md);
      expect(html).toContain('<table');
      expect(html).toContain('<th>');
    });

    it('should render task lists', async () => {
      const html = await renderMarkdown('- [x] done\n- [ ] todo');
      expect(html).toContain('type="checkbox"');
    });

    it('should render strikethrough', async () => {
      const html = await renderMarkdown('~~deleted~~');
      expect(html).toContain('<del>deleted</del>');
    });

    it('should autolink URLs', async () => {
      const html = await renderMarkdown(
        'Visit https://example.com today',
      );
      expect(html).toContain('<a href="https://example.com"');
    });
  });

  // ============================
  // 数学公式
  // ============================
  describe('Math', () => {
    it('should render inline math', async () => {
      const html = await renderMarkdown('Inline $E=mc^2$ formula', {
        math: true,
      });
      expect(html).toContain('katex');
    });

    it('should render block math', async () => {
      const html = await renderMarkdown(
        '$$\n\\sum_{i=1}^{n} i\n$$',
        { math: true },
      );
      expect(html).toContain('katex');
    });
  });

  // ============================
  // 安全
  // ============================
  describe('Security', () => {
    it('should sanitize script tags', async () => {
      const html = await renderMarkdown(
        '<script>alert("xss")</script>',
        { sanitize: true },
      );
      expect(html).not.toContain('<script>');
    });

    it('should preserve safe HTML when allowHtml is true', async () => {
      const html = await renderMarkdown('<em>safe</em>', {
        allowHtml: true,
        sanitize: true,
      });
      expect(html).toContain('<em>safe</em>');
    });

    it('should remove dangerous HTML attributes', async () => {
      const html = await renderMarkdown(
        '<div onclick="alert(1)">test</div>',
        { sanitize: true },
      );
      expect(html).not.toContain('onclick');
    });
  });

  // ============================
  // 同步渲染
  // ============================
  describe('Sync rendering', () => {
    it('should render markdown synchronously', () => {
      // 默认 processor 含 Shiki 异步插件，需关闭 highlight 才能使用 processSync
      const html = renderMarkdownSync('# Hello', { highlight: false });
      expect(html).toContain('<h1');
    });
  });

  // ============================
  // Front Matter
  // ============================
  describe('Front Matter', () => {
    it('should parse front matter without rendering it', async () => {
      const md = '---\ntitle: Test\n---\n\n# Content';
      const html = await renderMarkdown(md, { frontmatter: true });
      expect(html).not.toContain('title: Test');
      expect(html).toContain('<h1');
    });
  });

  // ============================
  // Emoji
  // ============================
  describe('Emoji', () => {
    it('should render emoji shortcodes', async () => {
      const html = await renderMarkdown(':smile:', { emoji: true });
      expect(html).toContain('😄');
    });
  });

  // ============================
  // 配置选项
  // ============================
  describe('Options', () => {
    it('should disable GFM when gfm=false', async () => {
      const md = '| a | b |\n|---|---|\n| 1 | 2 |';
      const html = await renderMarkdown(md, { gfm: false });
      expect(html).not.toContain('<table>');
    });

    it('should work with all features disabled', async () => {
      const html = await renderMarkdown('# Hello **world**', {
        gfm: false,
        math: false,
        emoji: false,
        frontmatter: false,
        sanitize: false,
      });
      expect(html).toContain('<h1');
      expect(html).toContain('<strong>world</strong>');
    });
  });
});
