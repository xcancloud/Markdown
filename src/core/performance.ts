// ============================================================
// 1. 增量渲染 — 使用 Web Worker
// ============================================================
// 使用 ?worker&inline 内联 worker，避免库被消费时构建无法解析独立的 worker 文件
import RendererWorker from './worker-renderer.ts?worker&inline';
import type { TocItem } from './plugins/toc-generator';

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
    this.worker = new RendererWorker();

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
export function splitHtmlBlocks(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return [html];

  return Array.from(container.children).map((el) => el.outerHTML);
}

// ============================================================
// 3. 缓存策略
// ============================================================

/** Cached render result (HTML + TOC extracted in the same pipeline pass). */
export interface RenderCacheEntry {
  html: string;
  toc: TocItem[];
}

export class RenderCache {
  private cache = new Map<string, { entry: RenderCacheEntry; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttlMs = 60_000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  private hash(source: string): string {
    // FNV-1a inspired hash with two independent 32-bit hashes to reduce collision risk
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < source.length; i++) {
      const char = source.charCodeAt(i);
      h1 ^= char;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= char;
      h2 = Math.imul(h2, 0x811c9dc5);
    }
    return (h1 >>> 0).toString(36) + '-' + (h2 >>> 0).toString(36) + '-' + source.length;
  }

  private makeKey(source: string, optionsKey = ''): string {
    return `${this.hash(source)}::${optionsKey}`;
  }

  /**
   * Returns cached HTML only (backward-compatible).
   * Pass `optionsKey` (from {@link processorOptionsCacheKey}) to partition by processor options.
   */
  get(source: string, optionsKey = ''): string | null {
    return this.getEntry(source, optionsKey)?.html ?? null;
  }

  /** Returns full cached entry including TOC, or null on miss / expiry. */
  getEntry(source: string, optionsKey = ''): RenderCacheEntry | null {
    const key = this.makeKey(source, optionsKey);
    const slot = this.cache.get(key);
    if (!slot) return null;
    if (Date.now() - slot.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return slot.entry;
  }

  /**
   * Store HTML (and optional TOC). Existing callers that only pass `(source, html)` keep working.
   */
  set(source: string, html: string, optionsKey = '', toc: TocItem[] = []): void {
    this.setEntry(source, optionsKey, { html, toc });
  }

  setEntry(source: string, optionsKey: string, entry: RenderCacheEntry): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(this.makeKey(source, optionsKey), {
      entry: { html: entry.html, toc: entry.toc },
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Shared LRU used by {@link MarkdownRenderer} and {@link useMarkdown}.
 * Keyed by source hash + processor options so different option sets do not collide.
 */
export const sharedRenderCache = new RenderCache(200, 120_000);
