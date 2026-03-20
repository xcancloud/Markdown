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
import { remarkAlert } from './plugins/remark-alert';
import { remarkContainer } from './plugins/remark-container';
import { remarkToc } from './plugins/toc-generator';
import { remarkCodeMeta } from './plugins/remark-code-meta';
import { rehypeA11y } from './accessibility';

import type { Root as MdastRoot } from 'mdast';
import type { Plugin, Processor } from 'unified';

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
  /** 是否启用代码高亮（关闭后可支持 processSync 同步渲染） */
  highlight?: boolean;
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
    highlight = true,
    remarkPlugins = [],
    rehypePlugins = [],
  } = options;

  // Use `any` for the processor chain since unified's strict generics
  // don't compose well with conditional plugin application.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processor: any = unified().use(remarkParse);

  // 第二阶段：mdast 变换 (remark 插件)
  if (gfm) processor = processor.use(remarkGfm);
  if (math) processor = processor.use(remarkMath);
  if (frontmatter) processor = processor.use(remarkFrontmatter, ['yaml', 'toml']);
  if (emoji) processor = processor.use(remarkEmoji);

  processor = processor.use(remarkDirective);

  // GFM Alert 插件 (> [!NOTE] 等)
  if (gfm) processor = processor.use(remarkAlert);

  // 自定义容器指令 (:::warning 等)
  processor = processor.use(remarkContainer);

  // 代码块扩展属性 (```python filename=hello.py 等)
  processor = processor.use(remarkCodeMeta);

  // TOC 插件 ([[toc]] / [toc] 替换)
  if (options.toc) processor = processor.use(remarkToc);

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
  if (math) processor = processor.use(rehypeKatex);

  // XSS 防护（必须在代码高亮之前，否则 Shiki 的 raw 节点会被剥离）
  if (sanitize) {
    const schema =
      options.sanitizeSchema ?? createSanitizeSchema({ math, mermaid });
    processor = processor.use(rehypeSanitize, schema);
  }

  // rehypeSlug 必须在 sanitize 之后，否则 id 属性会被剥离
  processor = processor
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' });

  // 代码高亮（Shiki 输出 raw 节点，需在 sanitize 之后运行，异步插件）
  if (highlight) {
    processor = processor.use(rehypeHighlightCode, { theme: codeTheme });
  }
  processor = processor.use(rehypeA11y);

  // 用户自定义 rehype 插件
  for (const plugin of rehypePlugins) {
    processor = processor.use(plugin);
  }

  // 第五阶段：hast → HTML 字符串（allowDangerousHtml 允许 Shiki raw 节点输出）
  processor = processor.use(rehypeStringify, { allowDangerousHtml: true });

  return processor;
}

// ============================================================
// 自定义净化 Schema（允许数学/图表的 class 等）
// ============================================================
function createSanitizeSchema(opts: { math?: boolean; mermaid?: boolean }) {
  const schema = { ...defaultSchema };
  schema.attributes = { ...schema.attributes };

  // Allow className, style, id, and all data-* attributes globally
  // (needed by Shiki, KaTeX, alerts, containers, heading anchors, code meta)
  schema.attributes!['*'] = [
    ...(schema.attributes!['*'] ?? []),
    'className',
    'style',
    'id',
    'data*',
  ];

  // Allow div and span (used by Shiki code blocks, containers, alerts)
  const extraTags = ['div', 'span'];
  schema.tagNames = [...(schema.tagNames ?? []), ...extraTags];

  if (opts.math) {
    schema.tagNames = [
      ...schema.tagNames,
      'math',
      'semantics',
      'annotation',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msup',
      'msub',
      'mfrac',
      'mover',
      'munder',
      'mtable',
      'mtr',
      'mtd',
      'mspace',
      'mtext',
      'msqrt',
    ];
  }

  if (opts.mermaid) {
    schema.attributes!['code'] = [
      ...(schema.attributes!['code'] ?? []),
      'className',
    ];
    schema.attributes!['pre'] = [
      ...(schema.attributes!['pre'] ?? []),
      'className',
    ];
  }

  // Allow aria attributes for a11y
  schema.attributes!['*'] = [
    ...schema.attributes!['*'],
    'ariaLabel',
    'role',
  ];

  return schema;
}

// ============================================================
// 便捷渲染函数
// ============================================================
export async function renderMarkdown(
  source: string,
  options?: ProcessorOptions,
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
  options?: ProcessorOptions,
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
  options?: ProcessorOptions,
): MdastRoot {
  const processor = unified().use(remarkParse);
  if (options?.gfm !== false) processor.use(remarkGfm);
  if (options?.math) processor.use(remarkMath);
  if (options?.frontmatter !== false) processor.use(remarkFrontmatter, ['yaml', 'toml']);
  return processor.parse(source);
}
