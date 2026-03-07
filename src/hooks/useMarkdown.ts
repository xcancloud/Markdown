import { useState, useEffect, useMemo } from 'react';
import { createProcessor, type ProcessorOptions } from '../core/processor';
import { parseToAst } from '../core/processor';
import { extractToc, type TocItem } from '../core/plugins/toc-generator';

export interface UseMarkdownResult {
  html: string;
  toc: TocItem[];
  isLoading: boolean;
  error: Error | null;
  /** 手动触发重新渲染 */
  refresh: () => void;
}

/**
 * Markdown 渲染 Hook，可在任意组件中使用
 */
export function useMarkdown(
  source: string,
  options?: ProcessorOptions,
): UseMarkdownResult {
  const [html, setHtml] = useState('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const processor = useMemo(
    () => createProcessor(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(options)],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    processor
      .process(source)
      .then((result: any) => {
        if (cancelled) return;
        setHtml(String(result));
        const ast = parseToAst(source, options);
        setToc(extractToc(ast));
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
  }, [source, processor, version]);

  return {
    html,
    toc,
    isLoading,
    error,
    refresh: () => setVersion((v) => v + 1),
  };
}
