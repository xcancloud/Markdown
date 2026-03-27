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
import { triggerCodeDownload } from '../core/utils/code-download';
import { sanitizeSvgMarkup } from '../core/utils/svg-sanitize';
import { useTheme } from '../context/MarkdownProvider';
import { useLocale } from '../context/MarkdownProvider';

// Lucide icon SVG strings for DOM-injected code block action buttons
const ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
const ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';

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
  /** 是否正在接收流式内容 */
  streaming?: boolean;
  /** 流式结束回调 */
  onStreamEnd?: () => void;
  /** 高度 */
  height?: string;
  /** 最小高度 */
  minHeight?: string;
  /** 最大高度 */
  maxHeight?: string;
}

type ComponentMap = {
  [tag: string]: React.ComponentType<any>;
};

const SCROLL_THRESHOLD = 80;

function showHtmlPreview(code: string, closeLabel: string) {
  const overlay = document.createElement('div');
  overlay.className = 'code-preview-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'code-preview-close';
  closeBtn.textContent = closeLabel;
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  const iframe = document.createElement('iframe');
  iframe.className = 'code-preview-iframe';
  // allow-scripts enables JS execution; allow-same-origin is intentionally
  // omitted so the sandboxed content cannot access the parent document.
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.srcdoc = code;

  overlay.appendChild(closeBtn);
  overlay.appendChild(iframe);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  document.body.appendChild(overlay);
}

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
    streaming = false,
    onStreamEnd,
    height,
    minHeight,
    maxHeight,
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
    const prevStreamingRef = useRef(streaming);
    /** 流式时也保留短 debounce（至少 50ms），合并高频更新以减少闪烁 */
    const effectiveDebounce = streaming ? Math.max(50, debounceMs) : debounceMs;
    const debouncedSource = useDebouncedValue(source, effectiveDebounce);

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
    // SVG 代码块预览（```svg / ```xml + SVG）
    // ========================================
    useEffect(() => {
      if (!containerRef.current) return;

      const containers = containerRef.current.querySelectorAll('.svg-preview-container');
      containers.forEach((el) => {
        const raw = el.getAttribute('data-svg');
        if (!raw) return;

        const lastRaw = el.getAttribute('data-last-svg');
        if (lastRaw !== raw) {
          el.setAttribute('data-last-svg', raw);
          while (el.firstChild) el.removeChild(el.firstChild);
          const safe = sanitizeSvgMarkup(raw);
          if (!safe) {
            const err = document.createElement('div');
            err.className = 'svg-preview-error';
            err.textContent = messages.renderer.svgInvalid;
            el.appendChild(err);
          } else {
            const frame = document.createElement('div');
            frame.className = 'svg-preview-frame';
            frame.innerHTML = safe;
            el.appendChild(frame);
          }
        }

        if (streaming || el.querySelector('.svg-preview-actions')) return;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'code-block-actions svg-preview-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.innerHTML = ICON_COPY;
        copyBtn.title = messages.renderer.copyCode;
        copyBtn.addEventListener('click', async () => {
          await copyToClipboard(raw);
          copyBtn.innerHTML = ICON_CHECK;
          setTimeout(() => (copyBtn.innerHTML = ICON_COPY), 2000);
        });
        actionsDiv.appendChild(copyBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-button';
        downloadBtn.innerHTML = ICON_DOWNLOAD;
        downloadBtn.title = messages.renderer.download;
        downloadBtn.addEventListener('click', () => {
          triggerCodeDownload(raw, 'svg');
        });
        actionsDiv.appendChild(downloadBtn);

        el.insertBefore(actionsDiv, el.firstChild);
      });
    }, [html, streaming, messages.renderer]);

    // ========================================
    // 代码块按钮注入 (复制 / 下载 / 预览)
    // 仅在流式结束后注入，避免 SSE 追加 token 渲染过程中误注入或闪烁
    // ========================================
    useEffect(() => {
      if (!containerRef.current || streaming) return;

      const codeBlocks = containerRef.current.querySelectorAll('.code-block');
      codeBlocks.forEach((block) => {
        if (block.querySelector('.code-block-actions')) return;

        const lang = (block.getAttribute('data-language') ?? '').toLowerCase();
        const code = block.querySelector('code')?.textContent ?? '';
        const metaFilename = block.getAttribute('data-filename') ?? undefined;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'code-block-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.innerHTML = ICON_COPY;
        copyBtn.title = messages.renderer.copyCode;
        copyBtn.addEventListener('click', async () => {
          await copyToClipboard(code);
          copyBtn.innerHTML = ICON_CHECK;
          setTimeout(() => (copyBtn.innerHTML = ICON_COPY), 2000);
        });
        actionsDiv.appendChild(copyBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-button';
        downloadBtn.innerHTML = ICON_DOWNLOAD;
        downloadBtn.title = messages.renderer.download;
        downloadBtn.addEventListener('click', () => {
          triggerCodeDownload(code, lang, metaFilename);
        });
        actionsDiv.appendChild(downloadBtn);

        if (lang === 'html') {
          const previewBtn = document.createElement('button');
          previewBtn.className = 'preview-button';
          previewBtn.innerHTML = ICON_EYE;
          previewBtn.title = messages.renderer.preview;
          previewBtn.addEventListener('click', () => {
            showHtmlPreview(code, messages.renderer.closePreview);
          });
          actionsDiv.appendChild(previewBtn);
        }

        (block as HTMLElement).style.position = 'relative';
        block.appendChild(actionsDiv);
      });
    }, [html, messages.renderer, streaming]);

    // ========================================
    // Streaming: onStreamEnd + auto-scroll
    // ========================================
    useEffect(() => {
      if (prevStreamingRef.current && !streaming) {
        onStreamEnd?.();
      }
      prevStreamingRef.current = streaming;
    }, [streaming, onStreamEnd]);

    useEffect(() => {
      if (streaming && containerRef.current) {
        const el = containerRef.current;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
        if (nearBottom) {
          el.scrollTop = el.scrollHeight;
        }
      }
    }, [html, streaming]);

    // ========================================
    // 事件代理 (链接 & 图片)
    // ========================================
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        const link = target.closest('a');
        if (link && onLinkClick) {
          const href = link.getAttribute('href');
          if (href) onLinkClick(href, e);
        }

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
        style={height !== undefined || minHeight !== undefined || maxHeight !== undefined ? { height, minHeight, maxHeight } : undefined}
      >
        {showToc && toc.length > 0 && (
          <aside className="markdown-toc-sidebar">
            <TocSidebar items={toc} />
          </aside>
        )}

        <div
          ref={containerRef}
          className={`markdown-body${streaming ? ' streaming' : ''}`}
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
