// ============================================================
// 1. 增量渲染 — 使用 Web Worker
// ============================================================
// 使用 ?worker&inline 内联 worker，避免库被消费时构建无法解析独立的 worker 文件
import RendererWorker from './worker-renderer.ts?worker&inline';

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
export class RenderCache {
  private cache = new Map<string, { html: string; timestamp: number }>();
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
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(this.hash(source), { html, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}
