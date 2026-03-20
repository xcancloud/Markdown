import { visit } from 'unist-util-visit';
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from 'shiki';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { looksLikeSvgMarkup } from '../utils/svg-sanitize';

interface HighlightOptions {
  theme?: string;
  langs?: BundledLanguage[];
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 高亮特定行 */
  highlightLines?: boolean;
}

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(theme: string): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [theme, 'github-light'],
      langs: [
        'javascript',
        'typescript',
        'python',
        'java',
        'c',
        'cpp',
        'csharp',
        'go',
        'rust',
        'ruby',
        'php',
        'swift',
        'kotlin',
        'html',
        'css',
        'scss',
        'json',
        'yaml',
        'toml',
        'xml',
        'sql',
        'bash',
        'shell',
        'powershell',
        'dockerfile',
        'markdown',
        'latex',
        'graphql',
        'regex',
      ],
    });
  }
  return highlighterPromise;
}

const rehypeHighlightCode: Plugin<[HighlightOptions?], Root> = (
  options = {},
) => {
  const { theme = 'github-dark', lineNumbers = false } = options;

  return async (tree: Root) => {
    const highlighter = await getHighlighter(theme);
    const nodesToProcess: { node: Element; lang: string; code: string; metaAttrs: Record<string, string> }[] = [];

    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName === 'pre' &&
        node.children.length === 1 &&
        (node.children[0] as Element).tagName === 'code'
      ) {
        const codeEl = node.children[0] as Element;
        const className = (codeEl.properties?.className as string[]) ?? [];
        const langClass = className.find((c) => c.startsWith('language-'));
        const lang = langClass?.replace('language-', '') ?? 'text';

        const code = extractText(codeEl);

        // Collect data-* meta attributes from the <code> element
        // (set by remark-code-meta via hProperties)
        const metaAttrs: Record<string, string> = {};
        if (codeEl.properties) {
          for (const [key, val] of Object.entries(codeEl.properties)) {
            if (key.startsWith('data') && key !== 'data-language' && typeof val === 'string') {
              // Convert camelCase (dataMeta) to kebab-case (data-meta)
              const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              metaAttrs[kebab] = val;
            }
          }
        }

        nodesToProcess.push({ node, lang, code, metaAttrs });
      }
    });

    for (const { node, lang, code, metaAttrs } of nodesToProcess) {
      // SVG 预览（```svg 或 ```xml 且内容为 SVG）
      const isSvgFence =
        lang === 'svg' || (lang === 'xml' && looksLikeSvgMarkup(code));
      if (isSvgFence) {
        node.tagName = 'div';
        node.properties = {
          ...node.properties,
          className: ['svg-preview-container'],
          'data-svg': code,
          'data-language': lang === 'svg' ? 'svg' : 'xml',
          ...metaAttrs,
        };
        node.children = [];
        continue;
      }

      // Mermaid 代码块跳过高亮，交给 Mermaid 渲染器
      if (lang === 'mermaid') {
        node.properties = {
          ...node.properties,
          className: ['mermaid-container'],
          'data-mermaid': code,
          ...metaAttrs,
        };
        continue;
      }

      try {
        const html = highlighter.codeToHtml(code, {
          lang: lang as BundledLanguage,
          themes: { dark: theme, light: 'github-light' },
        });

        // 替换节点的 children
        node.tagName = 'div';
        node.properties = {
          className: ['code-block', lineNumbers ? 'line-numbers' : ''].filter(
            Boolean,
          ),
          'data-language': lang,
          ...metaAttrs,
        };
        node.children = [{ type: 'raw', value: html }] as any;
      } catch {
        // 如果语言不支持，回退到普通渲染
      }
    }
  };
};

function extractText(node: any): string {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(extractText).join('');
  return '';
}

export default rehypeHighlightCode;
