/**
 * Lightweight viewer entry — no CodeMirror / MarkdownEditor.
 *
 * @example
 * import { MarkdownViewer, MarkdownProvider } from '@xcan-cloud/markdown/viewer';
 * import '@xcan-cloud/markdown/styles/renderer';
 */

// --- Components ---
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

// --- Context ---
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

// --- Hooks ---
export { useMarkdown, type UseMarkdownResult, type UseMarkdownOptions } from './hooks/useMarkdown';
export { useDebouncedValue } from './hooks/useDebouncedValue';

// --- Processor ---
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

// --- Cache / utils commonly needed with Viewer ---
export {
  RenderCache,
  sharedRenderCache,
  type RenderCacheEntry,
} from './core/performance';

export {
  type Locale,
  type I18nMessages,
  setLocale,
  getLocale,
  t,
  getMessages,
} from './i18n';
