// ============================================================
// 统一导出
// ============================================================

// --- 核心处理管道 ---
export {
  createProcessor,
  renderMarkdown,
  renderMarkdownSync,
  parseToAst,
  type ProcessorOptions,
} from './core/processor';

// --- 插件 ---
export { default as rehypeHighlightCode } from './core/plugins/rehype-highlight-code';
export {
  renderMermaidDiagram,
  initMermaid,
  type MermaidRendererOptions,
} from './core/plugins/mermaid-renderer';
export {
  extractToc,
  remarkToc,
  type TocItem,
} from './core/plugins/toc-generator';
export { remarkAlert } from './core/plugins/remark-alert';
export { remarkContainer } from './core/plugins/remark-container';

// --- React 组件 ---
export {
  MarkdownRenderer,
  type MarkdownRendererProps,
} from './components/MarkdownRenderer';
export {
  MarkdownEditor,
  type MarkdownEditorProps,
  type ToolbarItem,
  type ToolbarConfig,
  type LayoutMode,
} from './components/MarkdownEditor';
export {
  MarkdownViewer,
  type MarkdownViewerProps,
} from './components/MarkdownViewer';
export { ToolbarIcon } from './components/ToolbarIcon';
export {
  ThemeSwitcher,
  type ThemeSwitcherProps,
} from './components/ThemeSwitcher';
export {
  LocaleSwitcher,
  type LocaleSwitcherProps,
} from './components/LocaleSwitcher';

// --- Context Provider ---
export {
  MarkdownProvider,
  useTheme,
  useLocale,
  type ThemeMode,
  type MarkdownProviderProps,
} from './context/MarkdownProvider';

// --- i18n ---
export {
  type Locale,
  type I18nMessages,
  setLocale,
  getLocale,
  t,
  getMessages,
} from './i18n';

// --- Hooks ---
export { useMarkdown, type UseMarkdownResult } from './hooks/useMarkdown';
export { useDebouncedValue } from './hooks/useDebouncedValue';
export { useScrollSync } from './hooks/useScrollSync';

// --- 性能工具 ---
export {
  MarkdownWorkerRenderer,
  RenderCache,
  splitHtmlBlocks,
} from './core/performance';

// --- 安全工具 ---
export { sanitizeUrl, processExternalLinks, escapeHtml } from './core/security';

// --- 无障碍 ---
export { rehypeA11y } from './core/accessibility';

// --- 工具函数 ---
export { copyToClipboard } from './utils/clipboard';
export { slug, resetSlugger } from './utils/slug';

// --- 样式 (需要在消费端 import) ---
// import '@angus/markdown/styles'
