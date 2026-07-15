/**
 * Full renderer entry (TOC / Mermaid / code actions / streaming) — no CodeMirror.
 *
 * @example
 * import { MarkdownRenderer, MarkdownProvider } from '@xcan-cloud/markdown/renderer';
 * import '@xcan-cloud/markdown/styles/renderer';
 */

export {
  MarkdownRenderer,
  type MarkdownRendererProps,
  type CodeBlockInfo,
} from './components/MarkdownRenderer';
export {
  MarkdownViewer,
  type MarkdownViewerProps,
} from './components/MarkdownViewer';
export {
  ThemeSwitcher,
  type ThemeSwitcherProps,
} from './components/ThemeSwitcher';
export {
  LocaleSwitcher,
  type LocaleSwitcherProps,
} from './components/LocaleSwitcher';

export {
  MarkdownProvider,
  useTheme,
  useLocale,
  resolveThemeClass,
  type ThemeMode,
  type ThemeVariant,
  type MarkdownProviderProps,
} from './context/MarkdownProvider';

export const THEME_VARIANTS = ['default', 'angus', 'github', 'claude'] as const;

export { useMarkdown, type UseMarkdownResult, type UseMarkdownOptions } from './hooks/useMarkdown';
export { useDebouncedValue } from './hooks/useDebouncedValue';

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

export {
  RenderCache,
  sharedRenderCache,
  splitHtmlBlocks,
  MarkdownWorkerRenderer,
  type RenderCacheEntry,
} from './core/performance';

export { sanitizeUrl, processExternalLinks, escapeHtml } from './core/security';
export { rehypeA11y } from './core/accessibility';
export { copyToClipboard } from './utils/clipboard';

export {
  type Locale,
  type I18nMessages,
  setLocale,
  getLocale,
  t,
  getMessages,
} from './i18n';
