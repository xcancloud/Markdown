/**
 * 将用户提供的 SVG 字符串解析为可安全插入 DOM 的标记（移除 script、事件处理器、javascript: 链接等）
 */
export function sanitizeSvgMarkup(svgInput: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return '';
  }
  try {
    const trimmed = svgInput.trim();
    if (!trimmed) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) return '';

    const root = doc.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'svg') return '';

    root.querySelectorAll('script, foreignObject').forEach((n) => n.remove());

    const stripDangerousAttrs = (node: Element) => {
      const attrs = [...node.attributes];
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const val = attr.value;
        if (name.startsWith('on')) {
          node.removeAttribute(attr.name);
          continue;
        }
        if (
          (name === 'href' || name === 'xlink:href') &&
          /^\s*javascript:/i.test(val)
        ) {
          node.removeAttribute(attr.name);
        }
      }
      for (const child of [...node.children]) {
        stripDangerousAttrs(child as Element);
      }
    };

    stripDangerousAttrs(root);
    return root.outerHTML;
  } catch {
    return '';
  }
}

/** 判断 fenced 代码内容是否为 SVG 文档（用于 ```xml 等） */
export function looksLikeSvgMarkup(code: string): boolean {
  let t = code.trim();
  // 去掉前置 XML 声明与 HTML/XML 注释
  t = t.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  while (/^<!--[\s\S]*?-->\s*/i.test(t)) {
    t = t.replace(/^<!--[\s\S]*?-->\s*/i, '');
  }
  return /^<svg[\s>/]/i.test(t);
}
