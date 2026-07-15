/**
 * Editor entry — includes CodeMirror + MarkdownRenderer preview.
 *
 * @example
 * import { MarkdownEditor, MarkdownProvider } from '@xcan-cloud/markdown/editor';
 * import '@xcan-cloud/markdown/styles/editor';
 */

export {
  MarkdownEditor,
  DEFAULT_MARKDOWN_EDITOR_LAYOUT_MODES,
  type MarkdownEditorProps,
  type ToolbarItem,
  type ToolbarConfig,
  type LayoutMode,
} from './components/MarkdownEditor';
export {
  MarkdownRenderer,
  type MarkdownRendererProps,
  type CodeBlockInfo,
} from './components/MarkdownRenderer';
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
export { useScrollSync } from './hooks/useScrollSync';

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

export {
  type Locale,
  type I18nMessages,
  setLocale,
  getLocale,
  t,
  getMessages,
} from './i18n';
