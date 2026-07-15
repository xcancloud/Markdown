import { visit } from 'unist-util-visit';
import {
  createHighlighterCore,
  type HighlighterCore,
} from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { looksLikeSvgMarkup } from '../utils/svg-sanitize';

// 静态导入主题 + 核心语言（聊天 / 文档高频）
import themGithubDark from '@shikijs/themes/github-dark';
import themGithubLight from '@shikijs/themes/github-light';

import langJavascript from '@shikijs/langs/javascript';
import langTypescript from '@shikijs/langs/typescript';
import langHtml from '@shikijs/langs/html';
import langCss from '@shikijs/langs/css';
import langJson from '@shikijs/langs/json';
import langBash from '@shikijs/langs/bash';
import langPython from '@shikijs/langs/python';

interface HighlightOptions {
  theme?: string;
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 高亮特定行 */
  highlightLines?: boolean;
  /**
   * When false, ```mermaid fences stay as normal code blocks (no mermaid-container).
   * Default true for backward compatibility.
   */
  mermaid?: boolean;
}

const THEME_MAP: Record<string, any> = {
  'github-dark': themGithubDark,
  'github-light': themGithubLight,
};

const CORE_LANGS = [langJavascript, langTypescript, langHtml, langCss, langJson, langBash, langPython];
const CORE_LANG_IDS = [
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'bash',
  'python',
];

/** Map common fence aliases → Shiki language ids. */
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  docker: 'dockerfile',
};

/**
 * Extra languages loaded on demand via dynamic import (kept out of the main chunk).
 * Values are loaders returning the default grammar export.
 */
const EXTRA_LANG_LOADERS: Record<string, () => Promise<any>> = {
  java: () => import('@shikijs/langs/java').then((m) => m.default),
  c: () => import('@shikijs/langs/c').then((m) => m.default),
  cpp: () => import('@shikijs/langs/cpp').then((m) => m.default),
  go: () => import('@shikijs/langs/go').then((m) => m.default),
  rust: () => import('@shikijs/langs/rust').then((m) => m.default),
  ruby: () => import('@shikijs/langs/ruby').then((m) => m.default),
  kotlin: () => import('@shikijs/langs/kotlin').then((m) => m.default),
  scss: () => import('@shikijs/langs/scss').then((m) => m.default),
  yaml: () => import('@shikijs/langs/yaml').then((m) => m.default),
  xml: () => import('@shikijs/langs/xml').then((m) => m.default),
  sql: () => import('@shikijs/langs/sql').then((m) => m.default),
  dockerfile: () => import('@shikijs/langs/dockerfile').then((m) => m.default),
  graphql: () => import('@shikijs/langs/graphql').then((m) => m.default),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLangs = new Set<string>(CORE_LANG_IDS);

function resolveLangId(lang: string): string {
  return LANG_ALIASES[lang] ?? lang;
}

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
 * 按需加载语言（核心语言已在 highlighter 初始化时注册）
 */
async function ensureLanguage(highlighter: HighlighterCore, lang: string): Promise<boolean> {
  const id = resolveLangId(lang);
  if (loadedLangs.has(id)) return true;
  const loader = EXTRA_LANG_LOADERS[id];
  if (!loader) return false;
  try {
    const grammar = await loader();
    await highlighter.loadLanguage(grammar);
    loadedLangs.add(id);
    return true;
  } catch {
    return false;
  }
}

const rehypeHighlightCode: Plugin<[HighlightOptions?], Root> = (
  options = {},
) => {
  const {
    theme = 'github-dark',
    lineNumbers = false,
    mermaid: enableMermaid = true,
  } = options;

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

      // Mermaid 代码块跳过高亮，交给 Mermaid 渲染器（可被 options.mermaid=false 关闭）
      if (lang === 'mermaid' && enableMermaid) {
        node.properties = {
          ...node.properties,
          className: ['mermaid-container'],
          'data-mermaid': code,
          ...metaAttrs,
        };
        continue;
      }

      try {
        const resolved = resolveLangId(lang);
        const loaded = await ensureLanguage(highlighter, resolved);
        const effectiveLang = loaded ? resolved : 'text';

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
