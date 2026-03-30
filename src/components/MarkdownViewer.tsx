import React from 'react';
import { useMarkdown } from '../hooks/useMarkdown';
import type { ProcessorOptions } from '../core/processor';
import type { TocItem } from '../core/plugins/toc-generator';
import { useTheme, useLocale, resolveThemeClass, type ThemeMode } from '../context/MarkdownProvider';

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
  theme?: ThemeMode;
  /** 渲染完成回调 */
  onRendered?: (info: { html: string; toc: TocItem[] }) => void;
  /** 高度 */
  height?: string;
  /** 最小高度 */
  minHeight?: string;
  /** 最大高度 */
  maxHeight?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  source,
  options,
  className = '',
  theme: themeProp,
  onRendered,
  height,
  minHeight,
  maxHeight,
}) => {
  const { html, toc, isLoading, error } = useMarkdown(source, options);
  const { resolvedMode, theme: ctxTheme, variant } = useTheme();
  const { messages } = useLocale();
  const theme = themeProp ?? (ctxTheme || 'auto');
  const effectiveMode = theme === 'auto' ? resolvedMode : theme;
  const themeClass = resolveThemeClass(variant, effectiveMode);

  React.useEffect(() => {
    if (html && onRendered) {
      onRendered({ html, toc });
    }
  }, [html, toc, onRendered]);

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
      className={`markdown-renderer ${themeClass} ${className}`}
      data-loading={isLoading || undefined}
      style={height !== undefined || minHeight !== undefined || maxHeight !== undefined ? { height, minHeight, maxHeight } : undefined}
    >
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default MarkdownViewer;
