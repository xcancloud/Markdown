import { useState, useEffect, useMemo, useRef } from 'react';
import {
  createProcessor,
  processorOptionsCacheKey,
  type ProcessorOptions,
} from '../core/processor';
import type { TocItem } from '../core/plugins/toc-generator';
import { useDebouncedValue } from './useDebouncedValue';
import { sharedRenderCache } from '../core/performance';

export interface UseMarkdownResult {
  html: string;
  toc: TocItem[];
  isLoading: boolean;
  error: Error | null;
  /** 手动触发重新渲染 */
  refresh: () => void;
}

export interface UseMarkdownOptions extends ProcessorOptions {
  /** 防抖延迟 (ms)，默认 150 */
  debounceMs?: number;
  /** 是否启用渲染缓存，默认 true */
  cache?: boolean;
}

/**
 * Markdown 渲染 Hook，可在任意组件中使用。
 * 内置 debounce 和渲染缓存，TOC 在管道内单次提取，无需二次解析。
 */
export function useMarkdown(
  source: string,
  options?: UseMarkdownOptions,
): UseMarkdownResult {
  const { debounceMs = 150, cache: enableCache = true, ...processorOptions } = options ?? {};

  const [html, setHtml] = useState('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const debouncedSource = useDebouncedValue(source, debounceMs);
  // 缓存引用，避免闪烁
  const cacheRef = useRef(enableCache);
  cacheRef.current = enableCache;

  const optionsKey = useMemo(
    () => processorOptionsCacheKey(processorOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(processorOptions)],
  );

  const processor = useMemo(
    () => createProcessor(processorOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(processorOptions)],
  );

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!debouncedSource.trim()) {
        setHtml('');
        setToc([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const canCache = cacheRef.current && optionsKey !== null;
        if (canCache) {
          const cached = sharedRenderCache.getEntry(debouncedSource, optionsKey);
          if (cached) {
            if (cancelled) return;
            setHtml(cached.html);
            setToc(cached.toc);
            setIsLoading(false);
            return;
          }
        }

        const result = await processor.process(debouncedSource);
        if (cancelled) return;
        const renderedHtml = String(result);
        const tocData = (result.data?.toc as TocItem[]) ?? [];
        setHtml(renderedHtml);
        setToc(tocData);
        if (canCache) {
          sharedRenderCache.setEntry(debouncedSource, optionsKey, {
            html: renderedHtml,
            toc: tocData,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSource, processor, version, optionsKey]);

  return {
    html,
    toc,
    isLoading,
    error,
    refresh: () => setVersion((v) => v + 1),
  };
}
