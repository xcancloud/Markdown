import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { MarkdownRenderer, type MarkdownRendererProps } from './MarkdownRenderer';
import { ToolbarIcon } from './ToolbarIcon';
import { useTheme, useLocale, resolveThemeClass } from '../context/MarkdownProvider';

// ============================================================
// Props
// ============================================================
export interface MarkdownEditorProps
  extends Omit<MarkdownRendererProps, 'source'> {
  /** 初始内容 */
  initialValue?: string;
  /** 受控值 */
  value?: string;
  /** 内容变化回调 */
  onChange?: (value: string) => void;
  /** 布局模式 */
  layout?: LayoutMode;
  /**
   * 工具栏可切换的布局模式（左侧按钮与「布局」快捷键循环均使用）。
    * 默认包含 split / tabs / editor-only / preview-only。
    * 传入仅 `editor-only` 与 `preview-only` 时仅支持编辑 / 预览整页切换。
   */
  layoutModes?: LayoutMode[];
  /** 编辑器最小高度 */
  minHeight?: string;
  /** 编辑器最大高度 */
  maxHeight?: string;
  /** 编辑器额外扩展 */
  extensions?: Extension[];
  /** 工具栏配置 */
  toolbar?: ToolbarConfig;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否支持图片粘贴上传 */
  onImageUpload?: (file: File) => Promise<string>;
  /** 自动保存回调 */
  onAutoSave?: (value: string) => void;
  /** 自动保存间隔 (ms) */
  autoSaveInterval?: number;
  /** 快捷键映射 */
  shortcuts?: ShortcutMap;
  /** 最大字符数 */
  maxLength?: number;
  /** 编辑器占位提示文本 */
  placeholder?: string;
}

export type ToolbarConfig = boolean | ToolbarItem[] | { show?: boolean; items?: ToolbarItem[] };

export type LayoutMode = 'split' | 'tabs' | 'editor-only' | 'preview-only';

export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'heading'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'quote'
  | 'code'
  | 'codeblock'
  | 'link'
  | 'image'
  | 'table'
  | 'ul'
  | 'ol'
  | 'task'
  | 'hr'
  | 'math'
  | '|'
  | 'undo'
  | 'redo'
  | 'preview'
  | 'fullscreen'
  | 'layout';

type ShortcutMap = Record<string, (view: EditorView) => boolean>;

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'bold',
  'italic',
  'strikethrough',
  '|',
  'heading',
  'quote',
  '|',
  'code',
  'codeblock',
  '|',
  'link',
  'image',
  'table',
  '|',
  'ul',
  'ol',
  'task',
  '|',
  'math',
  'hr',
  '|',
  'undo',
  'redo',
  '|',
  'preview',
  'layout',
  'fullscreen',
];

const HEADING_LEVELS: ToolbarItem[] = ['h1', 'h2', 'h3', 'h4', 'h5'];

export const DEFAULT_MARKDOWN_EDITOR_LAYOUT_MODES: LayoutMode[] = [
  'split',
  'tabs',
  'editor-only',
  'preview-only',
];

function normalizeToolbarConfig(config: ToolbarConfig | undefined): { show: boolean; items: ToolbarItem[] } {
  if (config === false) return { show: false, items: [] };
  if (config === true || config === undefined) return { show: true, items: DEFAULT_TOOLBAR };
  if (Array.isArray(config)) return { show: true, items: config };
  return { show: config.show !== false, items: config.items ?? DEFAULT_TOOLBAR };
}

// ============================================================
// 编辑器工具栏操作
// ============================================================
const TOOLBAR_ACTIONS: Record<string, (view: EditorView) => void> = {
  bold: (view) => wrapSelection(view, '**', '**'),
  italic: (view) => wrapSelection(view, '*', '*'),
  strikethrough: (view) => wrapSelection(view, '~~', '~~'),
  heading: (view) => prependLine(view, '## '),
  h1: (view) => setHeadingLevel(view, 1),
  h2: (view) => setHeadingLevel(view, 2),
  h3: (view) => setHeadingLevel(view, 3),
  h4: (view) => setHeadingLevel(view, 4),
  h5: (view) => setHeadingLevel(view, 5),
  quote: (view) => prependLine(view, '> '),
  code: (view) => wrapSelection(view, '`', '`'),
  codeblock: (view) => wrapSelection(view, '\n```\n', '\n```\n'),
  link: (view) => wrapSelection(view, '[', '](url)'),
  image: (view) => insertText(view, '![alt](url)'),
  table: (view) =>
    insertText(
      view,
      '\n| Column 1 | Column 2 | Column 3 |\n' +
        '| -------- | -------- | -------- |\n' +
        '| Cell 1   | Cell 2   | Cell 3   |\n',
    ),
  ul: (view) => prependLine(view, '- '),
  ol: (view) => prependLine(view, '1. '),
  task: (view) => prependLine(view, '- [ ] '),
  hr: (view) => insertText(view, '\n---\n'),
  math: (view) => wrapSelection(view, '$', '$'),
};

// ============================================================
// 主编辑器组件
// ============================================================
export const MarkdownEditor = memo<MarkdownEditorProps>(
  ({
    initialValue = '',
    value,
    onChange,
    layout: layoutProp = 'split',
    layoutModes: layoutModesProp = DEFAULT_MARKDOWN_EDITOR_LAYOUT_MODES,
    minHeight = '400px',
    maxHeight = '800px',
    extensions: userExtensions = [],
    toolbar: toolbarProp,
    readOnly = false,
    onImageUpload,
    onAutoSave,
    autoSaveInterval = 30000,
    maxLength,
    placeholder,
    ...rendererProps
  }) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [content, setContent] = useState(value ?? initialValue);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentLayout, setCurrentLayout] = useState<LayoutMode>(layoutProp);
    const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
    const headingBtnRef = useRef<HTMLDivElement>(null);
    const { resolvedMode, variant } = useTheme();
    const { messages } = useLocale();
    const editorRootRef = useRef<HTMLDivElement>(null);
    const isTruncatingRef = useRef(false);

    const toolbar = normalizeToolbarConfig(toolbarProp);
    const layoutModes =
      layoutModesProp.length > 0 ? layoutModesProp : DEFAULT_MARKDOWN_EDITOR_LAYOUT_MODES;
    const layoutModesRef = useRef(layoutModes);
    layoutModesRef.current = layoutModes;

    // 受控 value 同步
    useEffect(() => {
      if (value !== undefined && value !== content) {
        setContent(value);
        if (viewRef.current) {
          const currentValue = viewRef.current.state.doc.toString();
          if (currentValue !== value) {
            viewRef.current.dispatch({
              changes: {
                from: 0,
                to: currentValue.length,
                insert: value,
              },
            });
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // 自动保存
    useEffect(() => {
      if (!onAutoSave || !autoSaveInterval) return;
      const timer = setInterval(() => onAutoSave(content), autoSaveInterval);
      return () => clearInterval(timer);
    }, [content, onAutoSave, autoSaveInterval]);

    // ========================================
    // 初始化 CodeMirror
    // ========================================
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          if (isTruncatingRef.current) {
            isTruncatingRef.current = false;
            return;
          }
          let newValue = update.state.doc.toString();
          if (maxLength !== undefined && newValue.length > maxLength) {
            newValue = newValue.slice(0, maxLength);
            isTruncatingRef.current = true;
            const cursor = Math.min(update.state.selection.main.head, maxLength);
            update.view.dispatch({
              changes: { from: maxLength, to: update.state.doc.length },
              selection: { anchor: cursor },
            });
          }
          setContent(newValue);
          onChange?.(newValue);
        }
      });

      // 图片粘贴处理
      const pasteHandler = EditorView.domEventHandlers({
        paste: (event, view) => {
          if (!onImageUpload) return false;
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const placeholder = '![Uploading...]()\n';
                const pos = view.state.selection.main.head;
                view.dispatch({
                  changes: { from: pos, insert: placeholder },
                });

                onImageUpload(file).then((url) => {
                  const safeUrl = url.replace(/[()]/g, encodeURIComponent);
                  const currentDoc = view.state.doc.toString();
                  const placeholderIndex = currentDoc.indexOf(placeholder);
                  if (placeholderIndex >= 0) {
                    view.dispatch({
                      changes: {
                        from: placeholderIndex,
                        to: placeholderIndex + placeholder.length,
                        insert: `![image](${safeUrl})\n`,
                      },
                    });
                  }
                });
              }
              return true;
            }
          }
          return false;
        },

        // 拖拽图片
        drop: (event, view) => {
          if (!onImageUpload) return false;
          const files = event.dataTransfer?.files;
          if (!files) return false;

          for (const file of files) {
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              onImageUpload(file).then((url) => {
                const safeUrl = url.replace(/[()]/g, encodeURIComponent);
                const pos =
                  view.posAtCoords({
                    x: event.clientX,
                    y: event.clientY,
                  }) ?? view.state.selection.main.head;
                view.dispatch({
                  changes: {
                    from: pos,
                    insert: `![image](${safeUrl})\n`,
                  },
                });
              });
              return true;
            }
          }
          return false;
        },
      });

      const state = EditorState.create({
        doc: content,
        extensions: [
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(defaultHighlightStyle),
          history(),
          drawSelection(),
          highlightActiveLine(),
          closeBrackets(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          updateListener,
          pasteHandler,
          EditorView.lineWrapping,
          EditorState.readOnly.of(readOnly),
          ...(placeholder !== undefined
            ? [cmPlaceholder(placeholder)]
            : messages.placeholder
              ? [cmPlaceholder(messages.placeholder)]
              : []),
          EditorView.theme({
            '&': { minHeight, maxHeight },
            '.cm-scroller': { overflow: 'auto' },
          }),
          ...userExtensions,
        ],
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========================================
    // 工具栏按钮点击
    // ========================================
    const handleToolbarAction = useCallback((action: ToolbarItem) => {
      const view = viewRef.current;

      if (action === 'undo') {
        if (view) { undo(view); view.focus(); }
        return;
      }
      if (action === 'redo') {
        if (view) { redo(view); view.focus(); }
        return;
      }
      if (action === 'preview') {
        setActiveTab((t) => (t === 'preview' ? 'editor' : 'preview'));
        return;
      }
      if (action === 'fullscreen') {
        setIsFullscreen((f) => !f);
        return;
      }
      if (action === 'layout') {
        setCurrentLayout((prev) => {
          const modes = layoutModesRef.current;
          if (modes.length === 0) return prev;
          const idx = modes.indexOf(prev);
          const i = idx >= 0 ? idx : 0;
          return modes[(i + 1) % modes.length];
        });
        return;
      }
      if (action === 'heading') {
        setHeadingMenuOpen((o) => !o);
        return;
      }

      // Close heading menu on any other action
      setHeadingMenuOpen(false);

      if (!view) return;
      const fn = TOOLBAR_ACTIONS[action];
      if (fn) fn(view);
      view.focus();
    }, []);

    // Close heading dropdown on outside click
    useEffect(() => {
      if (!headingMenuOpen) return;
      const handler = (e: MouseEvent) => {
        if (headingBtnRef.current && !headingBtnRef.current.contains(e.target as Node)) {
          setHeadingMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [headingMenuOpen]);

    // Sync prop layout changes
    useEffect(() => {
      setCurrentLayout(layoutProp);
    }, [layoutProp]);

    // 当前布局必须在 layoutModes 内（例如禁用分屏后从 split 回落）
    useEffect(() => {
      if (!layoutModes.includes(currentLayout)) {
        setCurrentLayout(layoutModes[0] ?? 'editor-only');
      }
    }, [layoutModes, currentLayout]);

    // ========================================
    // 渲染
    // ========================================
    const layout = currentLayout;
    const showEditor =
      layout === 'split' ||
      layout === 'editor-only' ||
      (layout === 'tabs' && activeTab === 'editor');
    const showPreview =
      layout === 'split' ||
      layout === 'preview-only' ||
      (layout === 'tabs' && activeTab === 'preview');

    const effectiveMode =
      rendererProps.theme && rendererProps.theme !== 'auto'
        ? rendererProps.theme
        : resolvedMode;
    const editorThemeClass = resolveThemeClass(variant, effectiveMode);

    return (
      <div
        ref={editorRootRef}
        className={`markdown-editor layout-${layout} ${editorThemeClass}${isFullscreen ? ' markdown-editor-fullscreen' : ''}${rendererProps.className ? ` ${rendererProps.className}` : ''}`}
      >
        {/* 工具栏 */}
        {toolbar.show && (
          <div className="markdown-toolbar" role="toolbar">
            {/* 左侧：布局切换（三个模式按钮同时展示） */}
            <div className="toolbar-left">
              {layoutModes.map((mode) => (
                <button
                  key={mode}
                  className={`toolbar-btn toolbar-layout${currentLayout === mode ? ' active' : ''}`}
                  onClick={() => setCurrentLayout(mode)}
                  title={messages.toolbar[`layout_${mode}` as keyof typeof messages.toolbar] ?? mode}
                  aria-label={mode}
                  aria-pressed={currentLayout === mode}
                >
                  <ToolbarIcon name={`layout-${mode}`} />
                </button>
              ))}
            </div>
            {/* 右侧：其他工具按钮 */}
            <div className="toolbar-right">
              {toolbar.items.filter((i) => i !== 'layout').map((item, index) =>
                item === '|' ? (
                  <span key={index} className="toolbar-separator" />
                ) : item === 'heading' ? (
                  <div key={item} className="toolbar-heading-group" ref={headingBtnRef}>
                    <button
                      className={`toolbar-btn toolbar-heading${headingMenuOpen ? ' active' : ''}`}
                      onClick={() => handleToolbarAction(item)}
                      title={messages.toolbar.heading}
                      aria-label={messages.toolbar.heading}
                      aria-expanded={headingMenuOpen}
                      aria-haspopup="true"
                    >
                      <ToolbarIcon name="heading" />
                      <span className="toolbar-caret">▾</span>
                    </button>
                    {headingMenuOpen && (
                      <div className="toolbar-dropdown" role="menu">
                        {HEADING_LEVELS.map((h) => (
                          <button
                            key={h}
                            className="toolbar-dropdown-item"
                            role="menuitem"
                            onClick={() => {
                              handleToolbarAction(h);
                              setHeadingMenuOpen(false);
                            }}
                          >
                            <ToolbarIcon name={h} />
                            <span>{messages.toolbar[h as keyof typeof messages.toolbar] ?? h.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item}
                    className={`toolbar-btn toolbar-${item}`}
                    onClick={() => handleToolbarAction(item)}
                    title={messages.toolbar[item as keyof typeof messages.toolbar] ?? item}
                    aria-label={messages.toolbar[item as keyof typeof messages.toolbar] ?? item}
                  >
                    <ToolbarIcon name={item} />
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* tabs 模式下即使隐藏工具栏，也保留最小切换入口 */}
        {!toolbar.show && layout === 'tabs' && (
          <div className="markdown-tabs-switcher" role="tablist" aria-label={messages.toolbar.layout_tabs}>
            <button
              className={`markdown-tabs-switcher-btn${activeTab === 'editor' ? ' active' : ''}`}
              onClick={() => setActiveTab('editor')}
              role="tab"
              aria-selected={activeTab === 'editor'}
              title={messages.toolbar['layout_editor-only']}
            >
              {messages.toolbar['layout_editor-only']}
            </button>
            <button
              className={`markdown-tabs-switcher-btn${activeTab === 'preview' ? ' active' : ''}`}
              onClick={() => setActiveTab('preview')}
              role="tab"
              aria-selected={activeTab === 'preview'}
              title={messages.toolbar['layout_preview-only']}
            >
              {messages.toolbar['layout_preview-only']}
            </button>
          </div>
        )}

        {/* 编辑区 & 预览区 */}
        <div className="markdown-editor-panels">
          <div
            className="markdown-editor-panel"
            ref={editorContainerRef}
            style={showEditor ? undefined : { display: 'none' }}
          />

          {showPreview && (
            <div className="markdown-preview-panel">
              <MarkdownRenderer source={content} {...rendererProps} />
            </div>
          )}
        </div>

        {maxLength !== undefined && (
          <div className="markdown-editor-counter">
            {content.length} / {maxLength}
          </div>
        )}
      </div>
    );
  },
);

MarkdownEditor.displayName = 'MarkdownEditor';

// ============================================================
// 辅助函数
// ============================================================
function wrapSelection(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: {
      from,
      to,
      insert: `${before}${selected || 'text'}${after}`,
    },
    selection: {
      anchor: from + before.length,
      head: from + before.length + (selected || 'text').length,
    },
  });
}

function prependLine(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  view.dispatch({
    changes: { from: line.from, insert: prefix },
  });
}

function setHeadingLevel(view: EditorView, level: number) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const text = line.text;
  // Remove existing heading prefix
  const stripped = text.replace(/^#{1,6}\s*/, '');
  const prefix = '#'.repeat(level) + ' ';
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: prefix + stripped },
  });
}

function insertText(view: EditorView, text: string) {
  const { from } = view.state.selection.main;
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  });
}

export default MarkdownEditor;
