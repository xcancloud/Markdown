// ============================================================
// 统一导出
// ============================================================

// --- 核心处理管道 ---
export {
  createProcessor,
  renderMarkdown,
  renderMarkdownSync,
  parseToAst,
  resolveProcessorOptionsForRender,
  processorOptionsCacheKey,
  type ProcessorOptions,
} from './core/processor';

export {
  CHAT_PROCESSOR_OPTIONS,
  STREAMING_PROCESSOR_OPTIONS,
  CHAT_RENDERER_DEFAULTS,
  createChatProcessor,
  createStreamingProcessor,
} from './core/presets';

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
  remarkExtractToc,
  type TocItem,
} from './core/plugins/toc-generator';
export { remarkAlert } from './core/plugins/remark-alert';
export { remarkContainer } from './core/plugins/remark-container';
export { remarkCodeMeta } from './core/plugins/remark-code-meta';

// --- Code block utilities ---
export {
  parseCodeMeta,
  extractCodeBlocks,
  type CodeBlockMeta,
} from './core/utils/code-meta';

// --- React 组件 ---
export {
  MarkdownRenderer,
  type MarkdownRendererProps,
  type CodeBlockInfo,
} from './components/MarkdownRenderer';
export {
  MarkdownEditor,
  DEFAULT_MARKDOWN_EDITOR_LAYOUT_MODES,
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
  resolveThemeClass,
  type ThemeMode,
  type ThemeVariant,
  type MarkdownProviderProps,
} from './context/MarkdownProvider';

// Theme variants list — used for UI variant pickers
export const THEME_VARIANTS = ['default', 'angus', 'github', 'claude'] as const;

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
export { useMarkdown, type UseMarkdownResult, type UseMarkdownOptions } from './hooks/useMarkdown';
export { useDebouncedValue } from './hooks/useDebouncedValue';
export { useScrollSync } from './hooks/useScrollSync';

// --- 性能工具 ---
export {
  MarkdownWorkerRenderer,
  RenderCache,
  sharedRenderCache,
  splitHtmlBlocks,
  type RenderCacheEntry,
} from './core/performance';

// --- 安全工具 ---
export { sanitizeUrl, processExternalLinks, escapeHtml } from './core/security';

// --- 无障碍 ---
export { rehypeA11y } from './core/accessibility';

// --- 工具函数 ---
export { copyToClipboard } from './utils/clipboard';
export { slug, resetSlugger } from './utils/slug';
export {
  performImageUpload,
  performFileUpload,
  createImageUploadLifecycle,
  createFileUploadLifecycle,
  encodeMarkdownUrl,
  sanitizeAltText,
  isImageFile,
  collectImageFiles,
  classifyClipboard,
  generateUploadId,
  type ImageUploadMessages,
  type ImageUploadLifecycle,
  type ImageUploadDocAdapter,
  type PerformImageUploadOptions,
  type ClipboardPayload,
  type MixedPastePolicy,
} from './utils/image-upload';

// --- 样式 (需要在消费端 import) ---
// import '@xcan-cloud/markdown/styles'
