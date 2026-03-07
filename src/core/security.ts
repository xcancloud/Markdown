// ============================================================
// XSS 防护 — 多层防御
// ============================================================

// 第一层：rehype-sanitize (基于 allowlist 的 HTML 净化)
// 已在 processor.ts 中集成

// 第二层：链接安全
export { sanitizeUrl, processExternalLinks, escapeHtml } from '../utils/sanitize';

// 第三层：iframe / embed / object 默认禁止
// 在 sanitize schema 中默认不包含这些标签
