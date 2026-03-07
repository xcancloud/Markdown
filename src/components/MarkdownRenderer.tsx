import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { createProcessor, type ProcessorOptions } from '../core/processor';
import { renderMermaidDiagram } from '../core/plugins/mermaid-renderer';
import { extractToc, type TocItem } from '../core/plugins/toc-generator';
import { parseToAst } from '../core/processor';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { copyToClipboard } from '../utils/clipboard';
import { useTheme } from '../context/MarkdownProvider';
import { useLocale } from '../context/MarkdownProvider';

// ============================================================
// Props 接口
// ============================================================
export interface MarkdownRendererProps {
  /** Markdown 源文本 */
  source: string;
  /** 处理器配置 */
  options?: ProcessorOptions;
  /** 自定义 class */
  className?: string;
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto';
  /** 是否显示目录侧边栏 */
  showToc?: boolean;
  /** 目录侧边栏位置 */
  tocPosition?: 'left' | 'right';
  /** 防抖延迟 (ms) */
  debounceMs?: number;
  /** 渲染完成回调 */
  onRendered?: (info: { html: string; toc: TocItem[] }) => void;
  /** 链接点击拦截 */
  onLinkClick?: (href: string, event: React.MouseEvent) => void;
  /** 图片点击（可用于 Lightbox） */
  onImageClick?: (src: string, alt: string, event: React.MouseEvent) => void;
  /** 自定义渲染器映射 */
  components?: Partial<ComponentMap>;
}

type ComponentMap = {
  [tag: string]: React.ComponentType<any>;
};

// ============================================================
// 主组件
// ============================================================
export const MarkdownRenderer = memo<MarkdownRendererProps>(
  ({
    source,
    options,
    className = '',
    theme: themeProp,
    showToc = true,
    tocPosition = 'right',
    debounceMs = 150,
    onRendered,
    onLinkClick,
    onImageClick,
  }) => {
    const { resolvedTheme, theme: ctxTheme } = useTheme();
    const { messages } = useLocale();
    const theme = themeProp ?? (ctxTheme || 'auto');
    const effectiveTheme = theme === 'auto' ? resolvedTheme : theme;

    const [html, setHtml] = useState<string>('');
    const [toc, setToc] = useState<TocItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const debouncedSource = useDebouncedValue(source, debounceMs);

    // 创建处理器（memoized）
    const processor = useMemo(
      () => createProcessor(options),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(options)],
    );

    // ========================================
    // 渲染管道
    // ========================================
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
          // 1. 渲染 HTML
          const result = await processor.process(debouncedSource);
          if (cancelled) return;
          const renderedHtml = String(result);

          // 2. 提取 TOC
          const ast = parseToAst(debouncedSource, options);
          const tocData = extractToc(ast);

          setHtml(renderedHtml);
          setToc(tocData);
          onRendered?.({ html: renderedHtml, toc: tocData });
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      render();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSource, processor]);

    // ========================================
    // Mermaid 图表后处理
    // ========================================
    useEffect(() => {
      if (!containerRef.current) return;

      const mermaidContainers =
        containerRef.current.querySelectorAll('.mermaid-container');

      mermaidContainers.forEach(async (el, index) => {
        const code = el.getAttribute('data-mermaid');
        if (!code || el.getAttribute('data-rendered')) return;

        el.setAttribute('data-rendered', 'true');
        const svg = await renderMermaidDiagram(code, `mermaid-${index}`);
        el.innerHTML = svg;
      });
    }, [html]);

    // ========================================
    // 代码块 "复制" 按钮注入
    // ========================================
    useEffect(() => {
      if (!containerRef.current) return;

      const codeBlocks = containerRef.current.querySelectorAll('.code-block');
      codeBlocks.forEach((block) => {
        if (block.querySelector('.copy-button')) return;

        const btn = document.createElement('button');
        btn.className = 'copy-button';
        btn.textContent = messages.renderer.copyCode;
        btn.addEventListener('click', async () => {
          const code = block.querySelector('code')?.textContent ?? '';
          await copyToClipboard(code);
          btn.textContent = messages.renderer.copied;
          setTimeout(() => (btn.textContent = messages.renderer.copyCode), 2000);
        });
        (block as HTMLElement).style.position = 'relative';
        block.appendChild(btn);
      });
    }, [html]);

    // ========================================
    // 事件代理 (链接 & 图片)
    // ========================================
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // 链接点击
        const link = target.closest('a');
        if (link && onLinkClick) {
          const href = link.getAttribute('href');
          if (href) onLinkClick(href, e);
        }

        // 图片点击
        if (target.tagName === 'IMG' && onImageClick) {
          const img = target as HTMLImageElement;
          onImageClick(img.src, img.alt, e);
        }
      },
      [onLinkClick, onImageClick],
    );

    // ========================================
    // 渲染
    // ========================================
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
        className={`markdown-renderer markdown-theme-${effectiveTheme} toc-${tocPosition} ${className}`}
        data-loading={isLoading || undefined}
      >
        {showToc && toc.length > 0 && (
          <aside className="markdown-toc-sidebar">
            <TocSidebar items={toc} />
          </aside>
        )}

        <div
          ref={containerRef}
          className="markdown-body"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  },
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

// ============================================================
// TOC 侧边栏子组件
// ============================================================
const TocSidebar: React.FC<{ items: TocItem[] }> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    );

    const headings = document.querySelectorAll(
      '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4',
    );
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [items]);

  const handleTocClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    },
    [],
  );

  const renderItems = (tocItems: TocItem[]) => (
    <ul className="toc-list">
      {tocItems.map((item) => (
        <li
          key={item.id}
          className={`toc-item toc-level-${item.depth} ${
            activeId === item.id ? 'toc-active' : ''
          }`}
        >
          <a href={`#${item.id}`} onClick={(e) => handleTocClick(e, item.id)}>{item.text}</a>
          {item.children.length > 0 && renderItems(item.children)}
        </li>
      ))}
    </ul>
  );

  return <nav className="toc-nav">{renderItems(items)}</nav>;
};

export default MarkdownRenderer;
