/**
 * 语言 → 下载扩展名（小写，不含点）
 */
export const CODE_LANG_EXT_MAP: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  ruby: 'rb',
  php: 'php',
  swift: 'swift',
  kotlin: 'kt',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yaml: 'yml',
  yml: 'yml',
  toml: 'toml',
  xml: 'xml',
  svg: 'svg',
  sql: 'sql',
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  powershell: 'ps1',
  dockerfile: 'dockerfile',
  markdown: 'md',
  md: 'md',
  latex: 'tex',
  tex: 'tex',
  graphql: 'graphql',
  text: 'txt',
  plaintext: 'txt',
};

const META_LINE_LIMIT = 24;
const META_HEAD_CHARS = 6000;

/**
 * 从代码块前几行解析 file / filename 元信息，否则使用默认名 code-snippet 与语言对应扩展名（默认 txt）
 */
export function parseCodeDownloadMeta(
  code: string,
  lang: string,
): { basename: string; ext: string } {
  const langLower = lang.toLowerCase();
  const extFromLang = CODE_LANG_EXT_MAP[langLower] || 'txt';

  const head = code.slice(0, META_HEAD_CHARS);
  const lines = head.split(/\r?\n/).slice(0, META_LINE_LIMIT);

  const patterns: RegExp[] = [
    /^\s*\/\/\s*file(?:name)?\s*[:=]\s*(.+?)\s*$/i,
    /^\s*#\s*file(?:name)?\s*[:=]\s*(.+?)\s*$/i,
    /^\s*\/\*\s*file(?:name)?\s*[:=]\s*(.+?)\s*\*\/\s*$/i,
    /^\s*<!--\s*file(?:name)?\s*[:=]\s*(.+?)\s*-->\s*$/i,
    /^\s*@file\s+(.+?)\s*$/i,
    /^\s*--\s*file(?:name)?\s*[:=]\s*(.+?)\s*$/i,
  ];

  const safeBase = (s: string) =>
    s.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 200);

  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (!m?.[1]) continue;
      let full = m[1].trim().replace(/^["']|["']$/g, '');
      if (!full) continue;
      full = full.split(/[/\\]/).pop() || full;
      const dot = full.lastIndexOf('.');
      if (dot > 0 && dot < full.length - 1) {
        const base = safeBase(full.slice(0, dot));
        let ext = full
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9+]/g, '');
        if (!ext) ext = extFromLang;
        return { basename: base || 'code-snippet', ext };
      }
      const base = safeBase(full);
      return { basename: base || 'code-snippet', ext: extFromLang };
    }
  }

  return { basename: 'code-snippet', ext: extFromLang };
}

export function triggerCodeDownload(code: string, lang: string): void {
  const { basename, ext } = parseCodeDownloadMeta(code, lang);
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${basename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
