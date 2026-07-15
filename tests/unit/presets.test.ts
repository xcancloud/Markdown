import { describe, it, expect } from 'vitest';
import {
  CHAT_PROCESSOR_OPTIONS,
  STREAMING_PROCESSOR_OPTIONS,
  CHAT_RENDERER_DEFAULTS,
  createChatProcessor,
  createStreamingProcessor,
} from '../../src/core/presets';
import { renderMarkdown } from '../../src/core/processor';

describe('chat / streaming presets', () => {
  it('CHAT_PROCESSOR_OPTIONS disables allowHtml / emoji / frontmatter', () => {
    expect(CHAT_PROCESSOR_OPTIONS.allowHtml).toBe(false);
    expect(CHAT_PROCESSOR_OPTIONS.emoji).toBe(false);
    expect(CHAT_PROCESSOR_OPTIONS.frontmatter).toBe(false);
    expect(CHAT_PROCESSOR_OPTIONS.sanitize).toBe(true);
    expect(CHAT_PROCESSOR_OPTIONS.gfm).toBe(true);
  });

  it('STREAMING_PROCESSOR_OPTIONS disables highlight and mermaid', () => {
    expect(STREAMING_PROCESSOR_OPTIONS.highlight).toBe(false);
    expect(STREAMING_PROCESSOR_OPTIONS.mermaid).toBe(false);
  });

  it('CHAT_RENDERER_DEFAULTS hides TOC', () => {
    expect(CHAT_RENDERER_DEFAULTS.showToc).toBe(false);
  });

  it('createChatProcessor strips raw script via allowHtml:false', async () => {
    const processor = createChatProcessor();
    const result = await processor.process('Hello <script>alert(1)</script>');
    const html = String(result);
    expect(html).not.toContain('<script>');
    expect(html).toContain('Hello');
  });

  it('createStreamingProcessor skips mermaid-container', async () => {
    const html = await renderMarkdown('```mermaid\nflowchart TD\n  A-->B\n```', {
      ...STREAMING_PROCESSOR_OPTIONS,
    });
    expect(html).not.toContain('mermaid-container');
  });

  it('createStreamingProcessor accepts overrides', async () => {
    const processor = createStreamingProcessor({ math: false });
    const result = await processor.process('$a$');
    // without math plugin, dollars stay as text-ish output (not katex)
    expect(String(result)).not.toContain('katex');
  });
});
