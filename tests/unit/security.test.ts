import { describe, it, expect } from 'vitest';
import { sanitizeUrl, processExternalLinks, escapeHtml } from '../../src/utils/sanitize';

describe('Security', () => {
  describe('sanitizeUrl', () => {
    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
      expect(sanitizeUrl('  javascript:alert(1)')).toBe('');
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:MsgBox("XSS")')).toBe('');
    });

    it('should block non-image data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should allow data:image URLs', () => {
      expect(sanitizeUrl('data:image/png;base64,abc')).toBe(
        'data:image/png;base64,abc',
      );
    });

    it('should allow safe URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeUrl('#anchor')).toBe('#anchor');
    });
  });

  describe('processExternalLinks', () => {
    it('should add target="_blank" to external links', () => {
      const html = '<a href="https://external.com">link</a>';
      const result = processExternalLinks(html, 'https://mysite.com');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should not modify internal links', () => {
      const html = '<a href="https://mysite.com/page">link</a>';
      const result = processExternalLinks(html, 'https://mysite.com');
      expect(result).not.toContain('target="_blank"');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });
  });
});
