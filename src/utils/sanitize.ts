// ============================================================
// XSS 防护 — 多层防御
// ============================================================

/**
 * 净化 URL：禁止 javascript:、vbscript:、不安全的 data: 协议
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // 禁止 javascript: 协议
  if (/^javascript:/i.test(trimmed)) return '';

  // 禁止 data: 协议（图片除外）
  if (/^data:/i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '';

  // 禁止 vbscript: 协议
  if (/^vbscript:/i.test(trimmed)) return '';

  return trimmed;
}

/**
 * 为外部链接添加 target="_blank" rel="noopener noreferrer"
 */
export function processExternalLinks(html: string, baseUrl: string): string {
  return html.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/g,
    (match, href: string) => {
      if (href.startsWith(baseUrl)) return match;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"`;
    },
  );
}

/**
 * 转义 HTML 特殊字符
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
