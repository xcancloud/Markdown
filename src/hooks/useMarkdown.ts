import { useState, useEffect, useMemo, useRef } from 'react';
import { createProcessor, type ProcessorOptions } from '../core/processor';
import type { TocItem } from '../core/plugins/toc-generator';
import { useDebouncedValue } from './useDebouncedValue';
import { RenderCache } from '../core/performance';

// 模块级单例缓存，所有 useMarkdown 实例共享
const globalCache = new RenderCache(200, 120_000);

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

  const processor = useMemo(
    () => createProcessor(processorOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(processorOptions)],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // 尝试命中缓存
    if (cacheRef.current) {
      const cached = globalCache.get(debouncedSource);
      if (cached !== null) {
        setHtml(cached);
        // 缓存命中时仍需提取 TOC（轻量操作）
        // TOC 从管道获取，但缓存只存 html，所以需要再跑一次 AST 提取
        // 这里仍走管道以获取 vfile.data.toc
      }
    }

    processor
      .process(debouncedSource)
      .then((result: any) => {
        if (cancelled) return;
        const renderedHtml = String(result);
        const tocData = (result.data?.toc as TocItem[]) ?? [];
        setHtml(renderedHtml);
        setToc(tocData);
        if (cacheRef.current) {
          globalCache.set(debouncedSource, renderedHtml);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSource, processor, version]);

  return {
    html,
    toc,
    isLoading,
    error,
    refresh: () => setVersion((v) => v + 1),
  };
}
