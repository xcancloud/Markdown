# 强大的 Markdown 组件 — 完整技术与功能实现方案

---

## 一、项目概览

构建一个**生产级、可扩展、高性能**的 Markdown 渲染与编辑组件，支持完整的 CommonMark / GFM 规范，并提供丰富的扩展能力。

---

## 二、需要支持的 Markdown 规范

### 2.1 核心规范：CommonMark (v0.31+)

CommonMark 是 Markdown 的标准化规范，**必须完整支持**：

| 分类 | 语法元素 | 示例 |
|------|---------|------|
| **块级元素** | 标题 (ATX & Setext) | `# H1` / `H1\n===` |
| | 段落 | 普通文本块 |
| | 块引用 | `> quote` |
| | 有序列表 | `1. item` |
| | 无序列表 | `- item` / `* item` |
| | 代码块 (缩进 & 围栏) | ` ``` code ``` ` |
| | 主题分割线 | `---` / `***` |
| | HTML 块 | `<div>...</div>` |
| **内联元素** | 强调 (斜体) | `*em*` / `_em_` |
| | 加粗 | `**bold**` / `__bold__` |
| | 行内代码 | `` `code` `` |
| | 链接 | `[text](url "title")` |
| | 图片 | `![alt](src "title")` |
| | 自动链接 | `<https://example.com>` |
| | HTML 内联 | `<em>text</em>` |
| | 硬换行 | 行尾两个空格 / `\` |
| | 软换行 | 普通换行 |
| **引用链接** | 完整引用 | `[text][id]` + `[id]: url` |
| | 折叠引用 | `[id][]` + `[id]: url` |
| | 快捷引用 | `[id]` + `[id]: url` |

### 2.2 GFM (GitHub Flavored Markdown) 扩展

| 语法元素 | 示例 |
|---------|------|
| 表格 | `\| col1 \| col2 \|` |
| 任务列表 | `- [x] done` / `- [ ] todo` |
| 删除线 | `~~text~~` |
| 自动链接扩展 | `https://example.com` (无需 `<>`) |
| 脚注 | `[^1]` + `[^1]: footnote text` |
| 告警/提示块 | `> [!NOTE]` / `> [!WARNING]` |

### 2.3 高级扩展语法

| 语法元素 | 示例 | 说明 |
|---------|------|------|
| 数学公式 (KaTeX/MathJax) | `$E=mc^2$` / `$$\sum_{i=1}^{n}$$` | 行内 & 块级 |
| Mermaid 图表 | ` ```mermaid ` | 流程图/时序图/甘特图 |
| 代码高亮 | ` ```javascript ` | 语言级语法高亮 |
| 上标 / 下标 | `H~2~O` / `x^2^` | 科学文档 |
| 缩写 | `*[HTML]: Hyper Text Markup Language` | 术语解释 |
| 定义列表 | `Term\n: Definition` | 词汇表 |
| 目录生成 | `[[toc]]` 或 `[TOC]` | 自动 TOC |
| Emoji | `:smile:` → 😄 | GitHub 风格 Emoji |
| 高亮标记 | `==highlighted==` | 荧光笔效果 |
| 容器指令 | `:::warning\ncontent\n:::` | 自定义容器 |
| Front Matter | `---\ntitle: xxx\n---` | YAML 元数据 |

---

## 三、技术架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Markdown Component                    │
├──────────────────────┬──────────────────────────────────┤
│    Editor Panel      │        Preview Panel              │
│  ┌────────────────┐  │  ┌────────────────────────────┐  │
│  │  CodeMirror 6   │  │  │   Rendered HTML Output      │  │
│  │  (编辑器引擎)    │  │  │   (实时预览)                │  │
│  └───────┬────────┘  │  └─────────────┬──────────────┘  │
│          │           │                │                  │
├──────────┴───────────┴────────────────┴──────────────────┤
│                   Core Pipeline                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──��─────┐ │
│  │  Parser   │→│    AST     │→│Transform │→│Renderer│ │
│  │(unified)  │ │   (mdast)  │ │(plugins) │ │ (hast) │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────────────────────┤
│                   Plugin System                          │
│  [Syntax Highlight] [Math] [Mermaid] [TOC] [Emoji] ... │
└─────────────────────────────────────────────────────────┘
```

### 3.2 核心技术栈选型

```typescript
// ============================================================
// 核心技术栈
// ============================================================

// 1. 解析引擎 — unified 生态系统
//    unified: 文本处理框架（核心管道）
//    remark: Markdown → mdast (Markdown AST)
//    rehype: mdast → hast (HTML AST) → HTML
//    recma:  mdast → esast (可选，用于 MDX)

// 2. 编辑器引擎
//    CodeMirror 6: 高性能、可扩展的代码编辑器

// 3. UI 框架
//    React 18+ (也提供 Vue 3 / Web Component 版本)

// 4. 构建工具
//    Vite + Rollup (库模式打包)
//    tsup (备选，用于纯 TS 库打包)

// 5. 样式方案
//    CSS Modules + CSS Custom Properties (主题变量)

// 6. 测试
//    Vitest + Testing Library + Playwright (E2E)

const dependencies = {
  // --- 解析 & 渲染管道 ---
  "unified":                  "^11.x",   // 核心处理框架
  "remark-parse":             "^11.x",   // Markdown → mdast
  "remark-gfm":               "^4.x",    // GFM 扩展
  "remark-math":              "^6.x",    // 数学公式解析
  "remark-frontmatter":       "^5.x",    // Front Matter
  "remark-directive":         "^3.x",    // 自定义容器指令
  "remark-emoji":             "^4.x",    // Emoji 支持
  "remark-rehype":            "^11.x",   // mdast → hast 桥接
  "rehype-stringify":         "^10.x",   // hast → HTML 字符串
  "rehype-sanitize":          "^6.x",    // XSS 防护 (HTML 净化)
  "rehype-highlight":         "^7.x",    // 代码语法高亮(备选)
  "rehype-katex":             "^7.x",    // KaTeX 数学渲染
  "rehype-slug":              "^6.x",    // 标题 ID 生成
  "rehype-autolink-headings": "^7.x",    // 标题锚点链接
  "rehype-raw":               "^7.x",    // 允许原始 HTML 通过

  // --- 语法高亮 ---
  "shiki":                    "^1.x",    // 主选高亮引擎 (VS Code 级别)

  // --- 数学渲染 ---
  "katex":                    "^0.16.x", // 数学公式渲染引擎

  // --- 图表 ---
  "mermaid":                  "^11.x",   // 图表渲染

  // --- 编辑器 ---
  "@codemirror/state":        "^6.x",
  "@codemirror/view":         "^6.x",
  "@codemirror/lang-markdown": "^6.x",
  "@codemirror/language":     "^6.x",

  // --- React 绑定 ---
  "react":                    "^18.x || ^19.x",
};
```

---

## 四、核心模块详细设计

### 4.1 解析管道 (Processing Pipeline)

```typescript
// src/core/processor.ts

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkEmoji from 'remark-emoji';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlightCode from './plugins/rehype-highlight-code';

import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';
import type { Plugin } from 'unified';

// ============================================================
// 处理器配置接口
// ============================================================
export interface ProcessorOptions {
  /** 是否启用 GFM 扩展 */
  gfm?: boolean;
  /** 是否启用数学公式 */
  math?: boolean;
  /** 是否启用 Mermaid 图表 */
  mermaid?: boolean;
  /** 是否启用 Front Matter 解析 */
  frontmatter?: boolean;
  /** 是否启用 Emoji */
  emoji?: boolean;
  /** 是否启用目录生成 */
  toc?: boolean;
  /** 是否启用 HTML 净化 (XSS 防护) */
  sanitize?: boolean;
  /** 自定义净化 schema */
  sanitizeSchema?: typeof defaultSchema;
  /** 代码高亮主题 */
  codeTheme?: string;
  /** 是否允许原始 HTML */
  allowHtml?: boolean;
  /** 自定义 remark 插件 */
  remarkPlugins?: Plugin[];
  /** 自定义 rehype 插件 */
  rehypePlugins?: Plugin[];
}

// ============================================================
// 创建处理器
// ============================================================
export function createProcessor(options: ProcessorOptions = {}) {
  const {
    gfm = true,
    math = true,
    mermaid = true,
    frontmatter = true,
    emoji = true,
    sanitize = true,
    allowHtml = true,
    codeTheme = 'github-dark',
    remarkPlugins = [],
    rehypePlugins = [],
  } = options;

  // 第一阶段：Markdown → mdast
  let processor = unified().use(remarkParse);

  // 第二阶段：mdast 变换 (remark 插件)
  if (gfm)         processor = processor.use(remarkGfm);
  if (math)        processor = processor.use(remarkMath);
  if (frontmatter) processor = processor.use(remarkFrontmatter, ['yaml', 'toml']);
  if (emoji)       processor = processor.use(remarkEmoji);

  processor = processor.use(remarkDirective);

  // 用户自定义 remark 插件
  for (const plugin of remarkPlugins) {
    processor = processor.use(plugin);
  }

  // 第三阶段：mdast → hast (桥接)
  processor = processor.use(remarkRehype, {
    allowDangerousHtml: allowHtml,
  });

  // 第四阶段：hast 变换 (rehype 插件)
  if (allowHtml) processor = processor.use(rehypeRaw);
  if (math)      processor = processor.use(rehypeKatex);

  processor = processor
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeHighlightCode, { theme: codeTheme });

  // 用户自定义 rehype 插件
  for (const plugin of rehypePlugins) {
    processor = processor.use(plugin);
  }

  // XSS 防护（必须在所有变换之后）
  if (sanitize) {
    const schema = options.sanitizeSchema ?? createSanitizeSchema({ math, mermaid });
    processor = processor.use(rehypeSanitize, schema);
  }

  // 第五阶段：hast → HTML 字符串
  processor = processor.use(rehypeStringify);

  return processor;
}

// ============================================================
// 自定义净化 Schema（允许数学/图表的 class 等）
// ============================================================
function createSanitizeSchema(opts: { math?: boolean; mermaid?: boolean }) {
  const schema = { ...defaultSchema };
  schema.attributes = { ...schema.attributes };

  if (opts.math) {
    // 允许 KaTeX 所需的 class 和标签
    schema.tagNames = [...(schema.tagNames ?? []), 'math', 'semantics', 'annotation',
      'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mover', 'munder',
      'mtable', 'mtr', 'mtd', 'mspace', 'mtext', 'msqrt'];
    schema.attributes!['*'] = [...(schema.attributes!['*'] ?? []), 'className', 'style'];
  }

  if (opts.mermaid) {
    schema.attributes!['code'] = [...(schema.attributes!['code'] ?? []), 'className'];
    schema.attributes!['pre'] = [...(schema.attributes!['pre'] ?? []), 'className'];
  }

  return schema;
}

// ============================================================
// 便捷渲染函数
// ============================================================
export async function renderMarkdown(
  source: string,
  options?: ProcessorOptions
): Promise<string> {
  const processor = createProcessor(options);
  const result = await processor.process(source);
  return String(result);
}

// ============================================================
// 同步渲染 (使用 processSync，适用于简单场景)
// ============================================================
export function renderMarkdownSync(
  source: string,
  options?: ProcessorOptions
): string {
  const processor = createProcessor(options);
  const result = processor.processSync(source);
  return String(result);
}

// ============================================================
// AST 提取 (供 TOC、大纲等功能使用)
// ============================================================
export function parseToAst(
  source: string,
  options?: ProcessorOptions
): MdastRoot {
  const processor = unified().use(remarkParse);
  if (options?.gfm !== false) processor.use(remarkGfm);
  if (options?.math)          processor.use(remarkMath);
  return processor.parse(source);
}
```

### 4.2 代码高亮插件 (Shiki)

```typescript
// src/core/plugins/rehype-highlight-code.ts

import { visit } from 'unist-util-visit';
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';
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
        'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
        'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'html', 'css', 'scss', 'json', 'yaml', 'toml', 'xml',
        'sql', 'bash', 'shell', 'powershell', 'dockerfile',
        'markdown', 'latex', 'graphql', 'regex',
      ],
    });
  }
  return highlighterPromise;
}

const rehypeHighlightCode: Plugin<[HighlightOptions?], Root> =
  (options = {}) => {
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

          // 提取纯文本
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
            className: ['code-block', lineNumbers ? 'line-numbers' : ''],
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
```

### 4.3 Mermaid 图表渲染器

```typescript
// src/core/plugins/mermaid-renderer.ts

import type { MermaidConfig } from 'mermaid';

let mermaidModule: typeof import('mermaid') | null = null;

// 懒加载 Mermaid（体积大，按需加载）
async function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidModule) {
    mermaidModule = await import('mermaid');
  }
  return mermaidModule;
}

export interface MermaidRendererOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  config?: Partial<MermaidConfig>;
}

export async function initMermaid(options: MermaidRendererOptions = {}) {
  const mermaid = await loadMermaid();

  mermaid.default.initialize({
    startOnLoad: false,
    theme: options.theme ?? 'default',
    securityLevel: 'strict',
    fontFamily: 'ui-monospace, monospace',
    ...options.config,
  });

  return mermaid.default;
}

/**
 * 渲染单个 Mermaid 图表
 * @returns SVG 字符串
 */
export async function renderMermaidDiagram(
  code: string,
  id: string
): Promise<string> {
  const mermaid = await initMermaid();

  try {
    // 先验证语法
    const isValid = await mermaid.parse(code);
    if (!isValid) {
      return createErrorBlock('Mermaid syntax error');
    }

    const { svg } = await mermaid.render(id, code);
    return svg;
  } catch (error) {
    return createErrorBlock(
      error instanceof Error ? error.message : 'Mermaid render error'
    );
  }
}

function createErrorBlock(message: string): string {
  return `<div class="mermaid-error">
    <span class="mermaid-error-icon">⚠️</span>
    <span class="mermaid-error-message">${escapeHtml(message)}</span>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

### 4.4 TOC（目录）生成器

```typescript
// src/core/plugins/toc-generator.ts

import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Heading } from 'mdast';
import type { Plugin } from 'unified';
import GithubSlugger from 'github-slugger';

export interface TocItem {
  depth: number;       // 1-6
  text: string;        // 纯文本
  id: string;          // slug (用作锚点)
  children: TocItem[];
}

/**
 * 从 mdast 中提取 TOC 结构
 */
export function extractToc(tree: Root): TocItem[] {
  const slugger = new GithubSlugger();
  const headings: { depth: number; text: string; id: string }[] = [];

  visit(tree, 'heading', (node: Heading) => {
    const text = toString(node);
    const id = slugger.slug(text);
    headings.push({ depth: node.depth, text, id });
  });

  return buildTocTree(headings);
}

/**
 * 将扁平的 heading 列表构建为嵌套树
 */
function buildTocTree(
  headings: { depth: number; text: string; id: string }[]
): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = { ...heading, children: [] };

    // 找到合适的父级
    while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
}

/**
 * remark 插件：将 [[toc]] 替换为目录
 */
export const remarkToc: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const toc = extractToc(tree);

    visit(tree, 'paragraph', (node, index, parent) => {
      const text = toString(node).trim().toLowerCase();
      if (text === '[[toc]]' || text === '[toc]') {
        // 替换为 HTML 目录
        const tocHtml = renderTocHtml(toc);
        (node as any).type = 'html';
        (node as any).value = tocHtml;
        delete (node as any).children;
      }
    });
  };
};

function renderTocHtml(items: TocItem[], depth = 0): string {
  if (items.length === 0) return '';

  const indent = '  '.repeat(depth);
  let html = `${indent}<ul class="markdown-toc markdown-toc-level-${depth}">\n`;

  for (const item of items) {
    html += `${indent}  <li>\n`;
    html += `${indent}    <a href="#${item.id}" class="markdown-toc-link">${escapeHtml(item.text)}</a>\n`;
    if (item.children.length > 0) {
      html += renderTocHtml(item.children, depth + 1);
    }
    html += `${indent}  </li>\n`;
  }

  html += `${indent}</ul>\n`;
  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

### 4.5 React 渲染组件

```tsx
// src/components/MarkdownRenderer.tsx

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { createProcessor, type ProcessorOptions } from '../core/processor';
import { renderMermaidDiagram } from '../core/plugins/mermaid-renderer';
import { extractToc, type TocItem } from '../core/plugins/toc-generator';
import { parseToAst } from '../core/processor';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { copyToClipboard } from '../utils/clipboard';

// ============================================================
// Props 接口
// ============================================================
export interface MarkdownRendererProps {
  /** Markdown 源文本 */
  source: string;
  /** 处理器配置 */
  options?: ProcessorOptions;
  /** 自定义 class */
  className?: string;
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto';
  /** 是否显示目录侧边栏 */
  showToc?: boolean;
  /** 防抖延迟 (ms) */
  debounceMs?: number;
  /** 渲染完成回调 */
  onRendered?: (info: { html: string; toc: TocItem[] }) => void;
  /** 链接点击拦截 */
  onLinkClick?: (href: string, event: React.MouseEvent) => void;
  /** 图片点击（可用于 Lightbox） */
  onImageClick?: (src: string, alt: string, event: React.MouseEvent) => void;
  /** 自定义渲染器映射 */
  components?: Partial<ComponentMap>;
}

type ComponentMap = {
  [tag: string]: React.ComponentType<any>;
};

// ============================================================
// 主组件
// ============================================================
export const MarkdownRenderer = memo<MarkdownRendererProps>(
  ({
    source,
    options,
    className = '',
    theme = 'auto',
    showToc = false,
    debounceMs = 150,
    onRendered,
    onLinkClick,
    onImageClick,
    components,
  }) => {
    const [html, setHtml] = useState<string>('');
    const [toc, setToc] = useState<TocItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedSource = useDebouncedValue(source, debounceMs);

    // 创建处理器（memoized）
    const processor = useMemo(
      () => createProcessor(options),
      [JSON.stringify(options)]
    );

    // ========================================
    // 渲染管道
    // ========================================
    useEffect(() => {
      let cancelled = false;

      async function render() {
        if (!debouncedSource.trim()) {
          setHtml('');
          setToc([]);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // 1. 渲染 HTML
          const result = await processor.process(debouncedSource);
          if (cancelled) return;
          const renderedHtml = String(result);

          // 2. 提取 TOC
          const ast = parseToAst(debouncedSource, options);
          const tocData = extractToc(ast);

          setHtml(renderedHtml);
          setToc(tocData);
          onRendered?.({ html: renderedHtml, toc: tocData });
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      render();
      return () => { cancelled = true; };
    }, [debouncedSource, processor]);

    // ========================================
    // Mermaid 图表后处理
    // ========================================
    useEffect(() => {
      if (!containerRef.current) return;

      const mermaidContainers = containerRef.current.querySelectorAll(
        '.mermaid-container'
      );

      mermaidContainers.forEach(async (el, index) => {
        const code = el.getAttribute('data-mermaid');
        if (!code || el.getAttribute('data-rendered')) return;

        el.setAttribute('data-rendered', 'true');
        const svg = await renderMermaidDiagram(code, `mermaid-${index}`);
        el.innerHTML = svg;
      });
    }, [html]);

    // ========================================
    // 代码块 "复制" 按钮注入
    // ========================================
    useEffect(() => {
      if (!containerRef.current) return;

      const codeBlocks = containerRef.current.querySelectorAll('.code-block');
      codeBlocks.forEach((block) => {
        if (block.querySelector('.copy-button')) return;

        const btn = document.createElement('button');
        btn.className = 'copy-button';
        btn.textContent = 'Copy';
        btn.addEventListener('click', async () => {
          const code = block.querySelector('code')?.textContent ?? '';
          await copyToClipboard(code);
          btn.textContent = 'Copied!';
          setTimeout(() => (btn.textContent = 'Copy'), 2000);
        });
        block.style.position = 'relative';
        block.appendChild(btn);
      });
    }, [html]);

    // ========================================
    // 事件代理 (链接 & 图片)
    // ========================================
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // 链接点击
        const link = target.closest('a');
        if (link && onLinkClick) {
          const href = link.getAttribute('href');
          if (href) onLinkClick(href, e);
        }

        // 图片点击
        if (target.tagName === 'IMG' && onImageClick) {
          const img = target as HTMLImageElement;
          onImageClick(img.src, img.alt, e);
        }
      },
      [onLinkClick, onImageClick]
    );

    // ========================================
    // 渲染
    // ========================================
    if (error) {
      return (
        <div className={`markdown-renderer markdown-error ${className}`}>
          <div className="markdown-error-banner">
            <strong>Render Error:</strong> {error.message}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`markdown-renderer markdown-theme-${theme} ${className}`}
        data-loading={isLoading || undefined}
      >
        {showToc && toc.length > 0 && (
          <aside className="markdown-toc-sidebar">
            <TocSidebar items={toc} />
          </aside>
        )}

        <div
          ref={containerRef}
          className="markdown-body"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

// ============================================================
// TOC 侧边栏子组件
// ============================================================
const TocSidebar: React.FC<{ items: TocItem[] }> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    const headings = document.querySelectorAll(
      '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4'
    );
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [items]);

  const renderItems = (tocItems: TocItem[]) => (
    <ul className="toc-list">
      {tocItems.map((item) => (
        <li
          key={item.id}
          className={`toc-item toc-level-${item.depth} ${
            activeId === item.id ? 'toc-active' : ''
          }`}
        >
          <a href={`#${item.id}`}>{item.text}</a>
          {item.children.length > 0 && renderItems(item.children)}
        </li>
      ))}
    </ul>
  );

  return <nav className="toc-nav">{renderItems(items)}</nav>;
};

export default MarkdownRenderer;
```

### 4.6 编辑器组件 (CodeMirror 6)

```tsx
// src/components/MarkdownEditor.tsx

import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { MarkdownRenderer, type MarkdownRendererProps } from './MarkdownRenderer';

// ============================================================
// Props
// ============================================================
export interface MarkdownEditorProps extends Omit<MarkdownRendererProps, 'source'> {
  /** 初始内容 */
  initialValue?: string;
  /** 受控值 */
  value?: string;
  /** 内容变化回调 */
  onChange?: (value: string) => void;
  /** 布局模式 */
  layout?: 'split' | 'tabs' | 'editor-only' | 'preview-only';
  /** 编辑器最小高度 */
  minHeight?: string;
  /** 编辑器最大高度 */
  maxHeight?: string;
  /** 编辑器额外扩展 */
  extensions?: Extension[];
  /** 工具栏配置 */
  toolbar?: ToolbarConfig;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否支持图片粘贴上传 */
  onImageUpload?: (file: File) => Promise<string>;
  /** 自动保存回调 */
  onAutoSave?: (value: string) => void;
  /** 自动保存间隔 (ms) */
  autoSaveInterval?: number;
  /** 快捷键映射 */
  shortcuts?: ShortcutMap;
}

interface ToolbarConfig {
  show?: boolean;
  items?: ToolbarItem[];
}

type ToolbarItem =
  | 'bold' | 'italic' | 'strikethrough' | 'heading'
  | 'quote' | 'code' | 'codeblock'
  | 'link' | 'image' | 'table'
  | 'ul' | 'ol' | 'task'
  | 'hr' | 'math'
  | '|'  // 分隔符
  | 'undo' | 'redo'
  | 'preview' | 'fullscreen';

type ShortcutMap = Record<string, (view: EditorView) => boolean>;

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'bold', 'italic', 'strikethrough', '|',
  'heading', 'quote', '|',
  'code', 'codeblock', '|',
  'link', 'image', 'table', '|',
  'ul', 'ol', 'task', '|',
  'math', 'hr', '|',
  'undo', 'redo', '|',
  'preview', 'fullscreen',
];

// ============================================================
// 编辑器工具栏操作
// ============================================================
const TOOLBAR_ACTIONS: Record<string, (view: EditorView) => void> = {
  bold: (view) => wrapSelection(view, '**', '**'),
  italic: (view) => wrapSelection(view, '*', '*'),
  strikethrough: (view) => wrapSelection(view, '~~', '~~'),
  heading: (view) => prependLine(view, '## '),
  quote: (view) => prependLine(view, '> '),
  code: (view) => wrapSelection(view, '`', '`'),
  codeblock: (view) => wrapSelection(view, '\n```\n', '\n```\n'),
  link: (view) => wrapSelection(view, '[', '](url)'),
  image: (view) => insertText(view, '![alt](url)'),
  table: (view) => insertText(view,
    '\n| Column 1 | Column 2 | Column 3 |\n' +
    '| -------- | -------- | -------- |\n' +
    '| Cell 1   | Cell 2   | Cell 3   |\n'
  ),
  ul: (view) => prependLine(view, '- '),
  ol: (view) => prependLine(view, '1. '),
  task: (view) => prependLine(view, '- [ ] '),
  hr: (view) => insertText(view, '\n---\n'),
  math: (view) => wrapSelection(view, '$', '$'),
};

// ============================================================
// 主编辑器组件
// ============================================================
export const MarkdownEditor = memo<MarkdownEditorProps>(
  ({
    initialValue = '',
    value,
    onChange,
    layout = 'split',
    minHeight = '400px',
    maxHeight = '800px',
    extensions: userExtensions = [],
    toolbar = { show: true, items: DEFAULT_TOOLBAR },
    readOnly = false,
    onImageUpload,
    onAutoSave,
    autoSaveInterval = 30000,
    shortcuts,
    ...rendererProps
  }) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [content, setContent] = useState(value ?? initialValue);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

    // 受控 value 同步
    useEffect(() => {
      if (value !== undefined && value !== content) {
        setContent(value);
        if (viewRef.current) {
          const currentValue = viewRef.current.state.doc.toString();
          if (currentValue !== value) {
            viewRef.current.dispatch({
              changes: { from: 0, to: currentValue.length, insert: value },
            });
          }
        }
      }
    }, [value]);

    // 自动保存
    useEffect(() => {
      if (!onAutoSave || !autoSaveInterval) return;
      const timer = setInterval(() => onAutoSave(content), autoSaveInterval);
      return () => clearInterval(timer);
    }, [content, onAutoSave, autoSaveInterval]);

    // ========================================
    // 初始化 CodeMirror
    // ========================================
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          setContent(newValue);
          onChange?.(newValue);
        }
      });

      // 图片粘贴处理
      const pasteHandler = EditorView.domEventHandlers({
        paste: (event, view) => {
          if (!onImageUpload) return false;
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const placeholder = `![Uploading...]()\n`;
                const pos = view.state.selection.main.head;
                view.dispatch({
                  changes: { from: pos, insert: placeholder },
                });

                onImageUpload(file).then((url) => {
                  const currentDoc = view.state.doc.toString();
                  const placeholderIndex = currentDoc.indexOf(placeholder);
                  if (placeholderIndex >= 0) {
                    view.dispatch({
                      changes: {
                        from: placeholderIndex,
                        to: placeholderIndex + placeholder.length,
                        insert: `![image](${url})\n`,
                      },
                    });
                  }
                });
              }
              return true;
            }
          }
          return false;
        },

        // 拖拽图片
        drop: (event, view) => {
          if (!onImageUpload) return false;
          const files = event.dataTransfer?.files;
          if (!files) return false;

          for (const file of files) {
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              onImageUpload(file).then((url) => {
                const pos = view.posAtCoords({
                  x: event.clientX,
                  y: event.clientY,
                }) ?? view.state.selection.main.head;
                view.dispatch({
                  changes: {
                    from: pos,
                    insert: `![image](${url})\n`,
                  },
                });
              });
              return true;
            }
          }
          return false;
        },
      });

      const state = EditorState.create({
        doc: content,
        extensions: [
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(defaultHighlightStyle),
          history(),
          drawSelection(),
          highlightActiveLine(),
          closeBrackets(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          updateListener,
          pasteHandler,
          EditorView.lineWrapping,
          EditorState.readOnly.of(readOnly),
          EditorView.theme({
            '&': { minHeight, maxHeight },
            '.cm-scroller': { overflow: 'auto' },
          }),
          ...userExtensions,
        ],
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    // ========================================
    // 工具栏按钮点击
    // ========================================
    const handleToolbarAction = useCallback((action: ToolbarItem) => {
      const view = viewRef.current;
      if (!view) return;

      if (action === 'undo') {
        view.dispatch(view.state.update({ effects: [] }));
        return;
      }
      if (action === 'redo') return;
      if (action === 'preview') {
        setActiveTab((t) => (t === 'preview' ? 'editor' : 'preview'));
        return;
      }

      const fn = TOOLBAR_ACTIONS[action];
      if (fn) fn(view);
      view.focus();
    }, []);

    // ========================================
    // 渲染
    // ========================================
    const showEditor =
      layout === 'split' ||
      layout === 'editor-only' ||
      (layout === 'tabs' && activeTab === 'editor');
    const showPreview =
      layout === 'split' ||
      layout === 'preview-only' ||
      (layout === 'tabs' && activeTab === 'preview');

    return (
      <div className={`markdown-editor layout-${layout}`}>
        {/* 工具栏 */}
        {toolbar.show && (
          <div className="markdown-toolbar" role="toolbar">
            {(toolbar.items ?? DEFAULT_TOOLBAR).map((item, index) =>
              item === '|' ? (
                <span key={index} className="toolbar-separator" />
              ) : (
                <button
                  key={item}
                  className={`toolbar-btn toolbar-${item}`}
                  onClick={() => handleToolbarAction(item)}
                  title={item}
                  aria-label={item}
                >
                  <ToolbarIcon name={item} />
                </button>
              )
            )}
          </div>
        )}

        {/* 编辑区 & 预览区 */}
        <div className="markdown-editor-panels">
          {showEditor && (
            <div className="markdown-editor-panel" ref={editorContainerRef} />
          )}

          {showPreview && (
            <div className="markdown-preview-panel">
              <MarkdownRenderer source={content} {...rendererProps} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

// ============================================================
// 辅助函数
// ============================================================
function wrapSelection(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: {
      from,
      to,
      insert: `${before}${selected || 'text'}${after}`,
    },
    selection: {
      anchor: from + before.length,
      head: from + before.length + (selected || 'text').length,
    },
  });
}

function prependLine(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  view.dispatch({
    changes: { from: line.from, insert: prefix },
  });
}

function insertText(view: EditorView, text: string) {
  const { from } = view.state.selection.main;
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  });
}

// 工具栏图标组件（简化示例）
const ToolbarIcon: React.FC<{ name: string }> = ({ name }) => {
  const icons: Record<string, string> = {
    bold: 'B', italic: 'I', strikethrough: 'S',
    heading: 'H', quote: '❝', code: '</>',
    codeblock: '{ }', link: '🔗', image: '🖼',
    table: '⊞', ul: '•', ol: '1.',
    task: '☑', hr: '―', math: '∑',
    undo: '↩', redo: '↪', preview: '👁',
    fullscreen: '⛶',
  };
  return <span>{icons[name] ?? name}</span>;
};

export default MarkdownEditor;
```

### 4.7 Hooks

```typescript
// src/hooks/useDebouncedValue.ts

import { useState, useEffect } from 'react';

/**
 * 防抖 Hook：在值停止变化后指定延迟后更新
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// src/hooks/useMarkdown.ts

import { useState, useEffect, useMemo } from 'react';
import { createProcessor, type ProcessorOptions } from '../core/processor';
import { parseToAst } from '../core/processor';
import { extractToc, type TocItem } from '../core/plugins/toc-generator';

export interface UseMarkdownResult {
  html: string;
  toc: TocItem[];
  isLoading: boolean;
  error: Error | null;
  /** 手动触发重新渲染 */
  refresh: () => void;
}

/**
 * Markdown 渲染 Hook，可在任意组件中使用
 */
export function useMarkdown(
  source: string,
  options?: ProcessorOptions
): UseMarkdownResult {
  const [html, setHtml] = useState('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const processor = useMemo(
    () => createProcessor(options),
    [JSON.stringify(options)]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    processor
      .process(source)
      .then((result) => {
        if (cancelled) return;
        setHtml(String(result));
        const ast = parseToAst(source, options);
        setToc(extractToc(ast));
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, processor, version]);

  return {
    html,
    toc,
    isLoading,
    error,
    refresh: () => setVersion((v) => v + 1),
  };
}
```

---

## 五、样式系统

```css
/* src/styles/markdown-renderer.css */

/* ============================================================
   CSS Custom Properties — 主题变量
   ============================================================ */
.markdown-renderer {
  /* 间距 */
  --md-spacing-xs: 4px;
  --md-spacing-sm: 8px;
  --md-spacing-md: 16px;
  --md-spacing-lg: 24px;
  --md-spacing-xl: 32px;

  /* 字体 */
  --md-font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
    Arial, sans-serif;
  --md-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
    monospace;
  --md-font-size-base: 16px;
  --md-line-height: 1.7;

  /* 圆角 */
  --md-radius: 6px;
}

/* Light 主题 */
.markdown-theme-light,
.markdown-theme-auto {
  --md-bg: #ffffff;
  --md-text: #1f2328;
  --md-text-secondary: #656d76;
  --md-border: #d0d7de;
  --md-link: #0969da;
  --md-code-bg: #f6f8fa;
  --md-blockquote-border: #d0d7de;
  --md-blockquote-text: #656d76;
  --md-table-border: #d0d7de;
  --md-table-row-alt: #f6f8fa;
  --md-mark-bg: #fff8c5;
}

/* Dark 主题 */
.markdown-theme-dark {
  --md-bg: #0d1117;
  --md-text: #e6edf3;
  --md-text-secondary: #8b949e;
  --md-border: #30363d;
  --md-link: #58a6ff;
  --md-code-bg: #161b22;
  --md-blockquote-border: #30363d;
  --md-blockquote-text: #8b949e;
  --md-table-border: #30363d;
  --md-table-row-alt: #161b22;
  --md-mark-bg: rgba(187, 128, 9, 0.15);
}

@media (prefers-color-scheme: dark) {
  .markdown-theme-auto {
    --md-bg: #0d1117;
    --md-text: #e6edf3;
    --md-text-secondary: #8b949e;
    --md-border: #30363d;
    --md-link: #58a6ff;
    --md-code-bg: #161b22;
    --md-blockquote-border: #30363d;
    --md-blockquote-text: #8b949e;
    --md-table-border: #30363d;
    --md-table-row-alt: #161b22;
    --md-mark-bg: rgba(187, 128, 9, 0.15);
  }
}

/* ============================================================
   Markdown Body
   ============================================================ */
.markdown-body {
  font-family: var(--md-font-body);
  font-size: var(--md-font-size-base);
  line-height: var(--md-line-height);
  color: var(--md-text);
  background: var(--md-bg);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Headings */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: var(--md-spacing-lg);
  margin-bottom: var(--md-spacing-md);
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--md-border);
  padding-bottom: 0.3em;
}
.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--md-border);
  padding-bottom: 0.3em;
}
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body h5 { font-size: 0.875em; }
.markdown-body h6 {
  font-size: 0.85em;
  color: var(--md-text-secondary);
}

/* Links */
.markdown-body a {
  color: var(--md-link);
  text-decoration: none;
}
.markdown-body a:hover {
  text-decoration: underline;
}

/* Inline Code */
.markdown-body code:not(pre code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--md-code-bg);
  border-radius: var(--md-radius);
  font-family: var(--md-font-mono);
}

/* Code Block */
.markdown-body .code-block {
  position: relative;
  margin: var(--md-spacing-md) 0;
  border-radius: var(--md-radius);
  overflow: hidden;
}

.markdown-body .code-block .copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid var(--md-border);
  border-radius: var(--md-radius);
  background: var(--md-bg);
  color: var(--md-text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.markdown-body .code-block:hover .copy-button {
  opacity: 1;
}

/* Blockquote */
.markdown-body blockquote {
  margin: var(--md-spacing-md) 0;
  padding: 0 1em;
  color: var(--md-blockquote-text);
  border-left: 0.25em solid var(--md-blockquote-border);
}

/* Tables */
.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  margin: var(--md-spacing-md) 0;
}

.markdown-body th,
.markdown-body td {
  padding: 6px 13px;
  border: 1px solid var(--md-table-border);
}

.markdown-body tr:nth-child(2n) {
  background-color: var(--md-table-row-alt);
}

.markdown-body th {
  font-weight: 600;
}

/* Task Lists */
.markdown-body .task-list-item {
  list-style-type: none;
}

.markdown-body .task-list-item input[type='checkbox'] {
  margin-right: 0.5em;
}

/* Images */
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: var(--md-radius);
}

/* Horizontal Rule */
.markdown-body hr {
  border: 0;
  border-top: 1px solid var(--md-border);
  margin: var(--md-spacing-lg) 0;
}

/* Mark / Highlight */
.markdown-body mark {
  background-color: var(--md-mark-bg);
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

/* GFM Alerts */
.markdown-body .markdown-alert {
  padding: var(--md-spacing-md);
  margin: var(--md-spacing-md) 0;
  border-radius: var(--md-radius);
  border-left: 4px solid;
}

.markdown-body .markdown-alert-note {
  border-color: #0969da;
  background: rgba(9, 105, 218, 0.08);
}
.markdown-body .markdown-alert-tip {
  border-color: #1a7f37;
  background: rgba(26, 127, 55, 0.08);
}
.markdown-body .markdown-alert-warning {
  border-color: #bf8700;
  background: rgba(191, 135, 0, 0.08);
}
.markdown-body .markdown-alert-caution {
  border-color: #cf222e;
  background: rgba(207, 34, 46, 0.08);
}

/* Mermaid */
.markdown-body .mermaid-container {
  display: flex;
  justify-content: center;
  margin: var(--md-spacing-md) 0;
  overflow-x: auto;
}

.markdown-body .mermaid-error {
  padding: var(--md-spacing-md);
  background: rgba(207, 34, 46, 0.08);
  border: 1px solid rgba(207, 34, 46, 0.3);
  border-radius: var(--md-radius);
  color: #cf222e;
}
```

---

## 六、性能优化策略

```typescript
// src/core/performance.ts

// ============================================================
// 1. 增量渲染 — 使用 Web Worker
// ============================================================

// worker-renderer.ts (Web Worker 线程)
// 将耗时的 markdown → html 处理放到 Worker 中，避免阻塞主线程

// main-thread.ts
export class MarkdownWorkerRenderer {
  private worker: Worker;
  private requestId = 0;
  private pending = new Map<
    number,
    {
      resolve: (html: string) => void;
      reject: (err: Error) => void;
    }
  >();

  constructor() {
    this.worker = new Worker(
      new URL('./worker-renderer.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {
      const { id, html, error } = event.data;
      const pending = this.pending.get(id);
      if (!pending) return;

      this.pending.delete(id);
      if (error) pending.reject(new Error(error));
      else pending.resolve(html);
    };
  }

  render(source: string, options?: any): Promise<string> {
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, source, options });
    });
  }

  destroy() {
    this.worker.terminate();
    this.pending.clear();
  }
}

// ============================================================
// 2. 虚拟滚动 — 大文档渲染
// ============================================================
// 对于超大 Markdown 文档 (>10000 行)，将输出分块：
// - 将 HTML 按顶层 block 元素切分
// - 使用 Intersection Observer 实现虚拟滚动
// - 仅渲染可视区域 ± buffer 的 block

export function splitHtmlBlocks(html: string): string[] {
  // 简单实现：按顶层标签分割
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return [html];

  return Array.from(container.children).map((el) => el.outerHTML);
}

// ============================================================
// 3. 缓存策略
// ============================================================
export class RenderCache {
  private cache = new Map<string, { html: string; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttlMs = 60_000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  private hash(source: string): string {
    // 简单 hash，生产中可用更快的算法如 xxHash
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      const char = source.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  get(source: string): string | null {
    const key = this.hash(source);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.html;
  }

  set(source: string, html: string): void {
    // LRU 淘汰
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(this.hash(source), { html, timestamp: Date.now() });
  }
}

// ============================================================
// 4. 代码高亮懒加载
// ============================================================
// Shiki 语言包按需加载，而非一次性加载全部 200+ 语言
// 在 rehype-highlight-code 插件中实现：
// - 检测文档中实际使用的语言
// - 仅动态 import 需要的语言 grammar
// - 使用 highlighter.loadLanguage() 按需加载
```

---

## 七、安全方案

```typescript
// src/core/security.ts

// ============================================================
// XSS 防护 — 多层防御
// ============================================================

// 第一层：rehype-sanitize (基于 allowlist 的 HTML 净化)
// 已在 processor.ts 中集成

// 第二层：CSP (Content Security Policy) 头部
// 在 Mermaid/KaTeX 使用内联样式时需要适当配置

// 第三层：链接安全
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // 禁止 javascript: 协议
  if (/^javascript:/i.test(trimmed)) return '';

  // 禁止 data: 协议 (图片除外)
  if (/^data:/i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '';

  // 禁止 vbscript: 协议
  if (/^vbscript:/i.test(trimmed)) return '';

  return trimmed;
}

// 第四层：外部链接标记
export function processExternalLinks(html: string, baseUrl: string): string {
  // 为外部链接添加 target="_blank" rel="noopener noreferrer"
  return html.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/g,
    (match, href) => {
      if (href.startsWith(baseUrl)) return match;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"`;
    }
  );
}

// 第五层：iframe / embed / object 默认禁止
// 在 sanitize schema 中默认不包含这些标签
```

---

## 八、无障碍 (Accessibility)

```typescript
// src/core/accessibility.ts

// ============================================================
// a11y 增强
// ============================================================

/**
 * rehype 插件：增强 HTML 的无障碍属性
 */
export function rehypeA11y() {
  return (tree: any) => {
    const { visit } = require('unist-util-visit');

    visit(tree, 'element', (node: any) => {
      // 1. 图片必须有 alt
      if (node.tagName === 'img' && !node.properties?.alt) {
        node.properties = node.properties ?? {};
        node.properties.alt = 'Image';
      }

      // 2. 表格添加 role
      if (node.tagName === 'table') {
        node.properties = node.properties ?? {};
        node.properties.role = 'table';
      }

      // 3. 代码块添加 aria-label
      if (
        node.tagName === 'pre' &&
        node.properties?.['data-language']
      ) {
        node.properties['aria-label'] =
          `Code block in ${node.properties['data-language']}`;
        node.properties.role = 'region';
      }

      // 4. 任务列表 checkbox 添加 aria-label
      if (
        node.tagName === 'input' &&
        node.properties?.type === 'checkbox'
      ) {
        node.properties['aria-label'] = node.properties.checked
          ? 'Completed task'
          : 'Incomplete task';
      }

      // 5. 数学公式添加 aria-label
      if (node.properties?.className?.includes?.('math')) {
        node.properties.role = 'math';
      }
    });
  };
}
```

---

## 九、项目目录结构

```
markdown-component/
├── src/
│   ├── core/
│   │   ├── processor.ts              # 核心处理管道
│   │   ├── performance.ts            # 性能优化工具
│   │   ├── security.ts               # 安全工具
│   │   ├── accessibility.ts          # 无障碍增强
│   │   ├── worker-renderer.ts        # Web Worker 渲染器
│   │   └── plugins/
│   │       ├── rehype-highlight-code.ts  # 代码高亮
│   │       ├── mermaid-renderer.ts       # Mermaid 图表
│   │       ├── toc-generator.ts          # TOC 生成
│   │       ├── remark-alert.ts           # GFM Alert
│   │       └── remark-container.ts       # 自定义容器
│   │
│   ├── components/
│   │   ├── MarkdownRenderer.tsx       # 渲染组件
│   │   ├── MarkdownEditor.tsx         # 编辑器组件
│   │   ├── MarkdownViewer.tsx         # 纯查看组件 (SSR 友好)
│   │   └── ToolbarIcon.tsx            # 工具栏图标
│   │
│   ├── hooks/
│   │   ├── useMarkdown.ts            # Markdown 渲染 Hook
│   │   ├── useDebouncedValue.ts       # 防抖 Hook
│   │   └── useScrollSync.ts          # 滚动同步 Hook
│   │
│   ├── styles/
│   │   ├── markdown-renderer.css      # 渲染样式
│   │   ├── markdown-editor.css        # 编辑器样式
│   │   ├── themes/
│   │   │   ├── github.css             # GitHub 风格主题
│   │   │   ├── notion.css             # Notion 风格
│   │   │   └── typora.css             # Typora 风格
│   │   └── code-themes/
│   │       ├── github-dark.css
│   │       └── one-dark.css
│   │
│   ├── utils/
│   │   ├── clipboard.ts              # 剪贴板工具
│   │   ├── slug.ts                    # Slug 生成
│   │   └── sanitize.ts               # 净化工具
│   │
│   └── index.ts                       # 统一导出
│
├── tests/
│   ├── unit/
│   │   ├── processor.test.ts
│   │   ├── toc-generator.test.ts
│   │   └── security.test.ts
│   ├── integration/
│   │   ├── renderer.test.tsx
│   │   └── editor.test.tsx
│   └── e2e/
│       └── markdown-editor.spec.ts
│
├── stories/                           # Storybook
│   ├── MarkdownRenderer.stories.tsx
│   └── MarkdownEditor.stories.tsx
│
├── package.json
├── tsconfig.json
├── vite.config.ts                     # 构建配置
├── vitest.config.ts                   # 测试配置
└── README.md
```

---

## 十、构建与导出配置

### 10.1 Vite 配置

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkdownComponent',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'mermaid',   // 大体积依赖外部化
        'katex',
        'shiki',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: 'terser',
    sourcemap: true,
  },
});
```

### 10.2 package.json

```json
{
  "name": "@your-scope/markdown-component",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles/markdown-renderer.css",
    "./themes/*": "./dist/styles/themes/*"
  },
  "files": ["dist"],
  "sideEffects": ["*.css"],
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "storybook": "storybook dev -p 6006",
    "prepublishOnly": "npm run build"
  }
}
```

---

## 十一、使用示例

```tsx
// examples/App.tsx

import React, { useState } from 'react';
import {
  MarkdownEditor,
  MarkdownRenderer,
  useMarkdown,
} from '@your-scope/markdown-component';
import '@your-scope/markdown-component/styles';

// ============================================================
// 示例 1：纯渲染模式
// ============================================================
function ReadOnlyView() {
  const markdownContent = `
# Hello World

This is a **powerful** markdown component.

## Features

- [x] CommonMark support
- [x] GFM tables, task lists
- [x] Code highlighting
- [ ] More to come...

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Math Support

Inline: $E = mc^2$

Block:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

> [!NOTE]
> This is an important note.

| Feature | Status |
|---------|--------|
| GFM     | ✅     |
| Math    | ✅     |
| Mermaid | ✅     |
`;

  return (
    <MarkdownRenderer
      source={markdownContent}
      theme="auto"
      showToc={true}
      options={{
        gfm: true,
        math: true,
        mermaid: true,
        sanitize: true,
      }}
      onLinkClick={(href, e) => {
        e.preventDefault();
        console.log('Link clicked:', href);
      }}
    />
  );
}

// ============================================================
// 示例 2：完整编辑器模式
// ============================================================
function EditorView() {
  const [value, setValue] = useState('# Start writing...\n');

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      layout="split"
      theme="auto"
      toolbar={{ show: true }}
      options={{ gfm: true, math: true }}
      onImageUpload={async (file) => {
        // 上传图片到你的服务器
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        return data.url;
      }}
      onAutoSave={(content) => {
        localStorage.setItem('draft', content);
      }}
      autoSaveInterval={5000}
    />
  );
}

// ============================================================
// 示例 3：Hook 模式（完全自定义 UI）
// ============================================================
function CustomView() {
  const [source, setSource] = useState(
    '# Custom\n\nUse the hook for full control.'
  );

  const { html, toc, isLoading, error } = useMarkdown(source, {
    gfm: true,
    math: true,
  });

  return (
    <div className="custom-layout">
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />

      <nav>
        <h3>Table of Contents</h3>
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{ paddingLeft: item.depth * 12 }}
          >
            {item.text}
          </a>
        ))}
      </nav>

      {isLoading && <div>Rendering...</div>}
      {error && <div className="error">{error.message}</div>}

      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function App() {
  return (
    <div>
      <ReadOnlyView />
      <EditorView />
      <CustomView />
    </div>
  );
}
```

---

## 十二、测试策略

```typescript
// tests/unit/processor.test.ts

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
        '[text](https://example.com "title")'
      );
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('title="title"');
    });

    it('should render fenced code blocks', async () => {
      const html = await renderMarkdown('```js\nconst x = 1;\n```');
      expect(html).toContain('const x = 1;');
    });

    it('should render ordered and unordered lists', async () => {
      const html = await renderMarkdown(
        '- item1\n- item2\n\n1. first\n2. second'
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
  });

  // ============================
  // GFM 扩展
  // ============================
  describe('GFM', () => {
    it('should render tables', async () => {
      const md = '| a | b |\n|---|---|\n| 1 | 2 |';
      const html = await renderMarkdown(md);
      expect(html).toContain('<table>');
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
        'Visit https://example.com today'
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
        { math: true }
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
        { sanitize: true }
      );
      expect(html).not.toContain('<script>');
    });

    it('should sanitize javascript: URLs', async () => {
      const html = await renderMarkdown(
        '[click](javascript:alert(1))',
        { sanitize: true }
      );
      expect(html).not.toContain('javascript:');
    });

    it('should preserve safe HTML when allowHtml is true', async () => {
      const html = await renderMarkdown('<em>safe</em>', {
        allowHtml: true,
        sanitize: true,
      });
      expect(html).toContain('<em>safe</em>');
    });
  });
});
```

---

## 十三、关键技术决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **解析引擎** | unified + remark + rehype | AST 驱动、插件化架构、生态最丰富 |
| **代码高亮** | Shiki | VS Code 级高亮质量、支持 200+ 语言 |
| **数学渲染** | KaTeX | 比 MathJax 快 10x+、SSR 友好 |
| **编辑器** | CodeMirror 6 | 现代架构、高性能、TypeScript 优先 |
| **图表** | Mermaid (懒加载) | 行业标准、支持多种图表类型 |
| **XSS 防护** | rehype-sanitize (allowlist) | 白名单策略、可定制、与管道深度集成 |
| **样式方案** | CSS Custom Properties | 轻量、主题切换无 JS 开销 |
| **性能** | Web Worker + 缓存 + 虚拟滚动 | 大文档场景不阻塞 UI |
| **打包** | Vite lib mode + ESM/CJS 双输出 | Tree-shaking 友好、现代工具链 |

---

> 这套方案提供了从 **规范支持 → 解析管道 → 渲染引擎 → 编辑器 → 性能优化 → 安全防护 → 无障碍 → 测试 → 打包分发** 的完整实现路径。你可以根据实际需求裁剪功能模块 ——例如如果只需要只读渲染，可以只用 `MarkdownRenderer` + `useMarkdown`，编辑器部分按需引入。