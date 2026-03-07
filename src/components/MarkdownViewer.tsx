import React from 'react';
import { useMarkdown } from '../hooks/useMarkdown';
import type { ProcessorOptions } from '../core/processor';
import type { TocItem } from '../core/plugins/toc-generator';
import { useTheme, useLocale } from '../context/MarkdownProvider';

/**
 * 纯查看组件 (SSR 友好) — 无 CodeMirror 依赖
 */
export interface MarkdownViewerProps {
  /** Markdown 源文本 */
  source: string;
  /** 处理器配置 */
  options?: ProcessorOptions;
  /** 自定义 class */
  className?: string;
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto';
  /** 渲染完成回调 */
  onRendered?: (info: { html: string; toc: TocItem[] }) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  source,
  options,
  className = '',
  theme: themeProp,
  onRendered,
}) => {
  const { html, isLoading, error } = useMarkdown(source, options);
  const { resolvedTheme, theme: ctxTheme } = useTheme();
  const { messages } = useLocale();
  const theme = themeProp ?? (ctxTheme || 'auto');
  const effectiveTheme = theme === 'auto' ? resolvedTheme : theme;

  React.useEffect(() => {
    if (html && onRendered) {
      onRendered({ html, toc: [] });
    }
  }, [html, onRendered]);

  if (error) {
    return (
      <div className={`markdown-renderer markdown-error ${className}`}>
        <div className="markdown-error-banner">
          <strong>{messages.renderer.renderError}</strong> {error.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`markdown-renderer markdown-theme-${effectiveTheme} ${className}`}
      data-loading={isLoading || undefined}
    >
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default MarkdownViewer;
