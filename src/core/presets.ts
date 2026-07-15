import { createProcessor, type ProcessorOptions } from './processor';

/**
 * Conservative processor options for chat / LLM bubbles.
 * Does **not** change {@link createProcessor} defaults — opt-in only.
 */
export const CHAT_PROCESSOR_OPTIONS: Readonly<ProcessorOptions> = {
  gfm: true,
  math: true,
  mermaid: true,
  frontmatter: false,
  emoji: false,
  toc: false,
  sanitize: true,
  allowHtml: false,
  highlight: true,
};

/**
 * Lightweight options for in-flight SSE / token streaming.
 * Prefer pairing with `MarkdownRenderer` `streaming={true}` (which already
 * forces `highlight: false`); this preset is for direct `createProcessor` /
 * `useMarkdown` callers that want the same shape explicitly.
 */
export const STREAMING_PROCESSOR_OPTIONS: Readonly<ProcessorOptions> = {
  ...CHAT_PROCESSOR_OPTIONS,
  highlight: false,
  mermaid: false,
};

/**
 * Suggested `MarkdownRenderer` props for chat embeds.
 * Component defaults are unchanged — spread these when mounting chat UI.
 */
export const CHAT_RENDERER_DEFAULTS = {
  showToc: false as const,
  debounceMs: 100,
};

/** `createProcessor` with {@link CHAT_PROCESSOR_OPTIONS}, overridable. */
export function createChatProcessor(
  overrides?: ProcessorOptions,
): ReturnType<typeof createProcessor> {
  return createProcessor({ ...CHAT_PROCESSOR_OPTIONS, ...overrides });
}

/** `createProcessor` with {@link STREAMING_PROCESSOR_OPTIONS}, overridable. */
export function createStreamingProcessor(
  overrides?: ProcessorOptions,
): ReturnType<typeof createProcessor> {
  return createProcessor({ ...STREAMING_PROCESSOR_OPTIONS, ...overrides });
}
