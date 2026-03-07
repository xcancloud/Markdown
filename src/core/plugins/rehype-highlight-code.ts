import { visit } from 'unist-util-visit';
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from 'shiki';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

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
    const nodesToProcess: { node: Element; lang: string; code: string }[] = [];

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
        nodesToProcess.push({ node, lang, code });
      }
    });

    for (const { node, lang, code } of nodesToProcess) {
      // Mermaid 代码块跳过高亮，交给 Mermaid 渲染器
      if (lang === 'mermaid') {
        node.properties = {
          ...node.properties,
          className: ['mermaid-container'],
          'data-mermaid': code,
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
