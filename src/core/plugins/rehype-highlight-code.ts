import { visit } from 'unist-util-visit';
import {
  createHighlighterCore,
  type HighlighterCore,
} from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { looksLikeSvgMarkup } from '../utils/svg-sanitize';

// 静态导入主题
import themGithubDark from '@shikijs/themes/github-dark';
import themGithubLight from '@shikijs/themes/github-light';

// 静态导入核心语言
import langJavascript from '@shikijs/langs/javascript';
import langTypescript from '@shikijs/langs/typescript';
import langHtml from '@shikijs/langs/html';
import langCss from '@shikijs/langs/css';
import langJson from '@shikijs/langs/json';
import langBash from '@shikijs/langs/bash';
import langPython from '@shikijs/langs/python';

// 按需导入的额外语言注册表
import langJava from '@shikijs/langs/java';
import langC from '@shikijs/langs/c';
import langCpp from '@shikijs/langs/cpp';
import langGo from '@shikijs/langs/go';
import langRust from '@shikijs/langs/rust';
import langRuby from '@shikijs/langs/ruby';
import langKotlin from '@shikijs/langs/kotlin';
import langScss from '@shikijs/langs/scss';
import langYaml from '@shikijs/langs/yaml';
import langXml from '@shikijs/langs/xml';
import langSql from '@shikijs/langs/sql';
import langShell from '@shikijs/langs/shellscript';
import langDockerfile from '@shikijs/langs/dockerfile';
import langGraphql from '@shikijs/langs/graphql';

interface HighlightOptions {
  theme?: string;
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 高亮特定行 */
  highlightLines?: boolean;
}

const THEME_MAP: Record<string, any> = {
  'github-dark': themGithubDark,
  'github-light': themGithubLight,
};

const CORE_LANGS = [langJavascript, langTypescript, langHtml, langCss, langJson, langBash, langPython];
const CORE_LANG_IDS = ['javascript', 'typescript', 'html', 'css', 'json', 'bash', 'python'];

// 额外支持的语言（静态导入，按需加载到 highlighter）
const EXTRA_LANG_MAP: Record<string, any> = {
  java: langJava,
  c: langC,
  cpp: langCpp,
  go: langGo,
  rust: langRust,
  ruby: langRuby,
  kotlin: langKotlin,
  scss: langScss,
  yaml: langYaml,
  yml: langYaml,
  xml: langXml,
  sql: langSql,
  shell: langShell,
  sh: langBash,
  zsh: langBash,
  dockerfile: langDockerfile,
  docker: langDockerfile,
  graphql: langGraphql,
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLangs = new Set<string>(CORE_LANG_IDS);

function getHighlighter(theme: string): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    const themeDark = THEME_MAP[theme] || themGithubDark;
    highlighterPromise = createHighlighterCore({
      themes: [themeDark, themGithubLight],
      langs: CORE_LANGS,
      engine: createOnigurumaEngine(import('shiki/wasm')),
    });
  }
  return highlighterPromise;
}

/**
 * 按需加载语言
 */
async function ensureLanguage(highlighter: HighlighterCore, lang: string): Promise<boolean> {
  if (loadedLangs.has(lang)) return true;
  const grammar = EXTRA_LANG_MAP[lang];
  if (!grammar) return false;
  try {
    await highlighter.loadLanguage(grammar);
    loadedLangs.add(lang);
    return true;
  } catch {
    return false;
  }
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
        // 按需加载该语言
        const loaded = await ensureLanguage(highlighter, lang);
        const effectiveLang = loaded ? lang : 'text';

        const html = highlighter.codeToHtml(code, {
          lang: effectiveLang,
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
