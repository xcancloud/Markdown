import React, { useState, useCallback, useEffect } from 'react';
import {
  MarkdownProvider,
  MarkdownRenderer,
  MarkdownEditor,
  ThemeSwitcher,
  LocaleSwitcher,
  type ThemeVariant,
} from '@xcan-cloud/markdown';
import '../../src/styles/markdown-renderer.css';
import '../../src/styles/markdown-editor.css';
import '../../src/styles/themes/angus.css';
import '../../src/styles/themes/github.css';

// ============================================================
// i18n content
// ============================================================
type SiteLang = 'en' | 'zh';

const SITE_TEXT = {
  en: {
    nav: { features: 'Features', demo: 'Demo', code: 'Code', github: 'GitHub' },
    hero: {
      badge: 'v1.5.0 — Production Ready',
      title1: 'The ',
      titleHighlight: 'Markdown Component',
      title2: ' for Modern React Apps',
      subtitle:
        'A production-grade, extensible, high-performance Markdown rendering & editing component with theme system, i18n, and 30+ language syntax highlighting.',
      liveDemo: 'Live Demo',
    },
    stats: [
      { value: '30+', label: 'Supported Languages' },
      { value: '2', label: 'Built-in Themes' },
      { value: '2', label: 'Locale Languages' },
      { value: 'ESM + CJS', label: 'Dual Output Formats' },
    ],
    features: {
      heading: 'Everything You Need',
      subheading: 'A complete toolkit for Markdown rendering and editing in React applications.',
      items: [
        { icon: '📝', color: '#eef1ff', title: 'Full Markdown Support', desc: 'CommonMark, GFM tables, task lists, strikethrough, footnotes, alerts — all out of the box.' },
        { icon: '🎨', color: '#fef3e2', title: 'Syntax Highlighting', desc: '30+ languages with VS Code-level quality via Shiki. Beautiful themes included.' },
        { icon: '📐', color: '#e8f5e9', title: 'Math & Diagrams', desc: 'KaTeX for math formulas and Mermaid for flowcharts, sequence, gantt diagrams.' },
        { icon: '🌗', color: '#f3e5f5', title: 'Theme System', desc: 'Light, Dark, and Auto (system) themes with CSS Custom Properties. Fully customizable.' },
        { icon: '🌍', color: '#e3f2fd', title: 'Internationalization', desc: 'Built-in en-US and zh-CN locales. All toolbar tooltips, messages, and UI strings translate.' },
        { icon: '⚡', color: '#fff3e0', title: 'High Performance', desc: 'Debounced rendering, Web Worker support, render caching, and lazy-loading for heavy plugins.' },
        { icon: '🔧', color: '#e8eaf6', title: 'Rich Editor', desc: 'CodeMirror 6 with lucide-react toolbar icons, image paste & drop, auto-save, split/tab layouts.' },
        { icon: '🧩', color: '#e8f5e9', title: 'Code Block Extensions', desc: 'Extended attributes on code fences (filename, dir, etc.) with parsing utilities for external access.' },
        { icon: '🔒', color: '#fce4ec', title: 'Security First', desc: 'HTML sanitization, URL validation, XSS prevention. Safe by default with rehype-sanitize.' },
        { icon: '♿', color: '#e0f2f1', title: 'Accessible', desc: 'ARIA roles, keyboard navigation, screen reader support. Follows WCAG guidelines.' },
      ],
    },
    demo: {
      heading: 'Live Demo',
      subheading: 'Try Markdown right here, right now.',
      tabRenderer: 'Renderer',
      tabEditor: 'Editor',
    },
    code: {
      heading: 'Simple to Use',
      subheading: 'Get started in minutes with clean, intuitive APIs.',
      tabLabels: {
        basic: 'Basic Rendering',
        editor: 'Editor with Upload',
        provider: 'Theme & i18n',
        hook: 'useMarkdown Hook',
        streaming: 'SSE Streaming',
        codeMeta: 'Code Block Meta',
        viewer: 'Viewer & Height',
      },
    },
    cta: {
      heading: 'Ready to Build?',
      subheading: 'Start using Markdown in your project today.',
      getStarted: 'Get Started',
      viewDocs: 'View Documentation',
    },
    footer: {
      desc: 'A production-grade Markdown rendering & editing component for React.',
      resources: 'Resources',
      community: 'Community',
      docs: 'Documentation',
      changelog: 'Changelog',
      examples: 'Examples',
      issues: 'Issues',
      discussions: 'Discussions',
      contributing: 'Contributing',
      copyright: '© 2025 XCan Cloud. MIT License.',
    },
  },
  zh: {
    nav: { features: '特性', demo: '演示', code: '代码', github: 'GitHub' },
    hero: {
      badge: 'v1.5.0 — 生产就绪',
      title1: '现代 React 应用的',
      titleHighlight: 'Markdown 组件',
      title2: '',
      subtitle:
        '一个生产级、可扩展、高性能的 Markdown 渲染与编辑组件，内置主题系统、国际化和 30+ 语言语法高亮。',
      liveDemo: '在线演示',
    },
    stats: [
      { value: '30+', label: '支持语言' },
      { value: '2', label: '内置主题' },
      { value: '2', label: '国际化语言' },
      { value: 'ESM + CJS', label: '双格式输出' },
    ],
    features: {
      heading: '一站式解决方案',
      subheading: '为 React 应用提供完整的 Markdown 渲染与编辑工具集。',
      items: [
        { icon: '📝', color: '#eef1ff', title: '完整 Markdown 支持', desc: 'CommonMark、GFM 表格、任务列表、删除线、脚注、提示框 — 开箱即用。' },
        { icon: '🎨', color: '#fef3e2', title: '语法高亮', desc: '通过 Shiki 支持 30+ 种语言，VS Code 级别的高亮品质，内含多种精美主题。' },
        { icon: '📐', color: '#e8f5e9', title: '数学公式与图表', desc: 'KaTeX 数学公式渲染，Mermaid 流程图、时序图、甘特图支持。' },
        { icon: '🌗', color: '#f3e5f5', title: '主题系统', desc: '浅色、深色和跟随系统三种主题，基于 CSS 自定义属性，完全可定制。' },
        { icon: '🌍', color: '#e3f2fd', title: '国际化', desc: '内置中文和英文语言包，工具栏提示、消息和所有 UI 文本均可翻译。' },
        { icon: '⚡', color: '#fff3e0', title: '高性能', desc: '防抖渲染、Web Worker 支持、渲染缓存和重型插件懒加载。' },
        { icon: '🔧', color: '#e8eaf6', title: '丰富编辑器', desc: '基于 CodeMirror 6，使用 lucide-react 图标工具栏，支持图片粘贴与拖拽、自动保存、多布局模式。' },
        { icon: '🧩', color: '#e8f5e9', title: '代码块扩展属性', desc: '支持代码块扩展属性（filename、dir 等），提供解析工具供外部获取代码块内容和属性。' },
        { icon: '🔒', color: '#fce4ec', title: '安全优先', desc: 'HTML 净化、URL 校验、XSS 防护，默认使用 rehype-sanitize 保障安全。' },
        { icon: '♿', color: '#e0f2f1', title: '无障碍访问', desc: 'ARIA 角色、键盘导航、屏幕阅读器支持，遵循 WCAG 指南。' },
      ],
    },
    demo: {
      heading: '在线演示',
      subheading: '在这里直接体验 AngusMarkdown。',
      tabRenderer: '渲染器',
      tabEditor: '编辑器',
    },
    code: {
      heading: '简单易用',
      subheading: '只需几分钟即可上手，API 简洁直观。',
      tabLabels: {
        basic: '基础渲染',
        editor: '编辑器与上传',
        provider: '主题与国际化',
        hook: 'useMarkdown Hook',
        streaming: 'SSE 流式渲染',
        codeMeta: '代码块扩展属性',
        viewer: 'Viewer 与高度',
      },
    },
    cta: {
      heading: '准备好开始了吗？',
      subheading: '今天就在你的项目中使用 AngusMarkdown。',
      getStarted: '快速开始',
      viewDocs: '查看文档',
    },
    footer: {
      desc: '一个生产级 React Markdown 渲染与编辑组件。',
      resources: '资源',
      community: '社区',
      docs: '文档',
      changelog: '更新日志',
      examples: '示例',
      issues: '问题反馈',
      discussions: '讨论',
      contributing: '贡献指南',
      copyright: '© 2025 XCan Cloud. MIT 许可证。',
    },
  },
};

// ============================================================
// Demo Markdown (bilingual)
// ============================================================
const DEMO_SOURCE_EN = `# Welcome to Markdown

## Features Showcase

Markdown supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Code Highlighting

\`\`\`typescript filename=App.tsx
import { MarkdownEditor } from '@xcan-cloud/markdown';

function App() {
  return (
    <MarkdownEditor
      initialValue="# Hello World"
      layout="split"
      theme="auto"
    />
  );
}
\`\`\`

### Code Block Extended Attributes

Code blocks support extended attributes after the language identifier:

\`\`\`python filename=hello.py dir=src/hello.py
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

### Math Formulas

Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### GFM Table

| Component | Description |
|-----------|-------------|
| MarkdownRenderer | Full-featured renderer |
| MarkdownEditor | CodeMirror 6 editor |
| MarkdownViewer | Lightweight viewer |

### Task List

- [x] CommonMark support
- [x] GFM extensions
- [x] Theme system (Light/Dark/Auto)
- [x] i18n (en-US / zh-CN)
- [x] Code highlighting (30+ languages)
- [x] KaTeX math rendering
- [x] Code block extended attributes
- [x] Lucide icons in toolbar & code blocks

### Alerts

> [!TIP]
> Markdown is production-ready and fully extensible!

> [!NOTE]
> Supports both ESM and CJS output formats.

---

*Built with the unified ecosystem*
`;

const DEMO_SOURCE_ZH = `# 欢迎使用 Markdown

## 功能展示

Markdown 支持 **加粗**、*斜体*、~~删除线~~ 和 \`行内代码\`。

### 代码高亮

\`\`\`typescript filename=App.tsx
import { MarkdownEditor } from '@xcan-cloud/markdown';

function App() {
  return (
    <MarkdownEditor
      initialValue="# 你好世界"
      layout="split"
      theme="auto"
    />
  );
}
\`\`\`

### 代码块扩展属性

代码块支持在语言标识符后添加扩展属性：

\`\`\`python filename=hello.py dir=src/hello.py
def greet(name: str) -> str:
    return f"你好, {name}!"

print(greet("世界"))
\`\`\`

### 数学公式

行内公式: $E = mc^2$

块级公式:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### GFM 表格

| 组件 | 说明 |
|------|------|
| MarkdownRenderer | 全功能渲染器 |
| MarkdownEditor | CodeMirror 6 编辑器 |
| MarkdownViewer | 轻量级查看器 |

### 任务列表

- [x] CommonMark 支持
- [x] GFM 扩展
- [x] 主题系统（浅色/深色/自动）
- [x] 国际化（中文/英文）
- [x] 代码高亮（30+ 种语言）
- [x] KaTeX 数学公式渲染
- [x] 代码块扩展属性
- [x] Lucide 图标（工具栏和代码块）

### 提示框

> [!TIP]
> Markdown 已生产就绪，完全可扩展！

> [!NOTE]
> 支持 ESM 和 CJS 双格式输出。

---

*基于 unified 生态系统构建*
`;

// ============================================================
// Code examples (shared, same for both languages)
// ============================================================
const CODE_EXAMPLES = {
  basic: `import { MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return (
    <MarkdownRenderer
      source="# Hello World"
      theme="auto"
      showToc
    />
  );
}`,
  editor: `import { MarkdownEditor } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return (
    <MarkdownEditor
      initialValue="# Start editing..."
      layout="split"
      maxLength={5000}
      toolbar={['bold', 'italic', '|', 'code', 'codeblock', '|', 'link', 'image']}
      onChange={(value) => console.log(value)}
      onImageUpload={async (file) => {
        return URL.createObjectURL(file);
      }}
    />
  );
}`,
  provider: `import {
  MarkdownProvider,
  MarkdownEditor,
  ThemeSwitcher,
  LocaleSwitcher,
} from '@xcan-cloud/markdown';

function App() {
  return (
    <MarkdownProvider
      defaultTheme="auto"
      defaultLocale="en-US"
    >
      <ThemeSwitcher />
      <LocaleSwitcher />
      <MarkdownEditor
        initialValue="# Hello!"
        layout="split"
      />
    </MarkdownProvider>
  );
}`,
  hook: `import { useMarkdown } from '@xcan-cloud/markdown';

function MyComponent() {
  const { html, toc, isLoading, error } =
    useMarkdown('# Hello', { gfm: true, math: true });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}`,
  streaming: `import { useState } from 'react';
import { MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function StreamingDemo() {
  const [content, setContent] = useState('');
  const [streaming, setStreaming] = useState(false);

  const startStream = () => {
    setContent('');
    setStreaming(true);

    const es = new EventSource('/api/chat/stream');
    es.onmessage = (event) => {
      setContent((prev) => prev + JSON.parse(event.data).token);
    };
    es.addEventListener('done', () => {
      es.close();
      setStreaming(false);
    });
    es.onerror = () => { es.close(); setStreaming(false); };
  };

  return (
    <div>
      <button onClick={startStream} disabled={streaming}>
        {streaming ? 'Streaming...' : 'Start'}
      </button>
      <MarkdownRenderer
        source={content}
        streaming={streaming}
        onStreamEnd={() => console.log('Done')}
        showToc={false}
      />
    </div>
  );
}`,
  codeMeta: `import { parseCodeMeta, extractCodeBlocks } from '@xcan-cloud/markdown';

// Parse attributes from a code fence meta string
const attrs = parseCodeMeta('filename=hello.py dir=src');
console.log(attrs);
// => { filename: 'hello.py', dir: 'src' }

// Extract all code blocks from Markdown source
const markdown = \`
\\\`\\\`\\\`python filename=hello.py dir=src/hello.py
print("Hello, World!")
\\\`\\\`\\\`
\`;

const blocks = extractCodeBlocks(markdown);
blocks.forEach(block => {
  console.log(block.language);    // 'python'
  console.log(block.meta);        // 'filename=hello.py dir=src/hello.py'
  console.log(block.attributes);  // { filename: 'hello.py', dir: 'src/hello.py' }
  console.log(block.code);        // 'print("Hello, World!")'
});`,
  viewer: `import { MarkdownViewer, MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

// MarkdownViewer — SSR-friendly, zero CodeMirror dependency.
// Best for display-only pages: docs, blog posts, changelogs.
function DocumentPage({ markdown }: { markdown: string }) {
  return (
    <MarkdownViewer
      source={markdown}
      theme="auto"
      height="600px"
      onRendered={({ html }) => console.log('HTML length:', html.length)}
    />
  );
}

// Min / max height on MarkdownViewer
function BoundedPage({ markdown }: { markdown: string }) {
  return (
    <MarkdownViewer
      source={markdown}
      minHeight="200px"
      maxHeight="80vh"
    />
  );
}

// Height constraints on MarkdownRenderer (full-featured)
function InlinePreview({ source }: { source: string }) {
  return (
    <MarkdownRenderer
      source={source}
      height="400px"
      showToc={false}
    />
  );
}

// Editor CodeMirror pane height (independent of preview height)
function TallEditor() {
  return (
    <MarkdownEditor
      initialValue="# Hello"
      layout="split"
      minHeight="300px"
      maxHeight="800px"
    />
  );
}`,
};

// ============================================================
// App Component
// ============================================================

type ShowcaseTab = 'renderer' | 'editor';
const STYLE_THEMES: { value: ThemeVariant; label: { en: string; zh: string } }[] = [
  { value: 'default', label: { en: 'Default', zh: '默认' } },
  { value: 'angus', label: { en: 'Angus', zh: 'Angus' } },
  { value: 'github', label: { en: 'GitHub', zh: 'GitHub' } },
];

const App: React.FC = () => {
  const [lang, setLang] = useState<SiteLang>('en');
  const [showcaseTab, setShowcaseTab] = useState<ShowcaseTab>('renderer');
  const [codeTab, setCodeTab] = useState<keyof typeof CODE_EXAMPLES>('basic');
  const [copied, setCopied] = useState(false);
  const [styleTheme, setStyleTheme] = useState<ThemeVariant>('angus');

  const t = SITE_TEXT[lang];
  const demoSource = lang === 'zh' ? DEMO_SOURCE_ZH : DEMO_SOURCE_EN;
  const componentLocale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const toggleLang = useCallback(() => {
    setLang((l) => (l === 'en' ? 'zh' : 'en'));
  }, []);

  const handleCopyInstall = useCallback(() => {
    navigator.clipboard.writeText('npm install @xcan-cloud/markdown').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Scroll-triggered reveal animation
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  return (
    <div>
      {/* Navigation */}
      <nav className="site-nav">
        <div className="container nav-inner">
          <a href="#" className="nav-brand">
            <span className="nav-logo">A</span>
            Markdown
          </a>
          <div className="nav-links">
            <a href="#features">{t.nav.features}</a>
            <a href="#demo">{t.nav.demo}</a>
            <a href="#code">{t.nav.code}</a>
            <a href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer" className="nav-github">
              <svg className="nav-github-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              {t.nav.github}
            </a>
          </div>
          <div className="nav-actions">
            <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">{t.hero.badge}</div>
          <h1>
            {t.hero.title1}
            <span className="gradient-text">{t.hero.titleHighlight}</span>
            {t.hero.title2 && <><br />{t.hero.title2}</>}
          </h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#demo">
              {t.hero.liveDemo}
            </a>
            <a className="btn btn-secondary" href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <div className="hero-install">
            <span className="install-prefix">$</span>
            <code>npm install @xcan-cloud/markdown</code>
            <button className="copy-btn" onClick={handleCopyInstall} aria-label="Copy install command">
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid reveal-stagger">
            {t.stats.map((s, i) => (
              <div key={s.label} className="stat-item reveal" style={{ '--reveal-i': i } as React.CSSProperties}>
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>{t.features.heading}</h2>
            <p>{t.features.subheading}</p>
          </div>
          <div className="feature-grid reveal-stagger">
            {t.features.items.map((f, i) => (
              <div key={f.title} className="feature-card reveal" style={{ '--reveal-i': i } as React.CSSProperties}>
                <div className="feature-icon" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo / Showcase */}
      <section className="showcase" id="demo">
        <div className="container">
          <div className="section-header reveal">
            <h2>{t.demo.heading}</h2>
            <p>{t.demo.subheading}</p>
          </div>
          <MarkdownProvider key={styleTheme} defaultTheme="light" defaultVariant={styleTheme} defaultLocale={componentLocale}>
            <div className="showcase-controls">
              <ThemeSwitcher />
              <LocaleSwitcher />
              <div className="style-switcher">
                {STYLE_THEMES.map((st) => (
                  <button
                    key={st.value}
                    className={`style-switcher-btn${styleTheme === st.value ? ' active' : ''}`}
                    onClick={() => setStyleTheme(st.value)}
                  >
                    {st.label[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="showcase-demo">
              <div className="showcase-tabs">
                <button
                  className={`showcase-tab ${showcaseTab === 'renderer' ? 'active' : ''}`}
                  onClick={() => setShowcaseTab('renderer')}
                >
                  {t.demo.tabRenderer}
                </button>
                <button
                  className={`showcase-tab ${showcaseTab === 'editor' ? 'active' : ''}`}
                  onClick={() => setShowcaseTab('editor')}
                >
                  {t.demo.tabEditor}
                </button>
              </div>
              <div className="showcase-content">
                {showcaseTab === 'renderer' ? (
                  <MarkdownRenderer
                    source={demoSource}
                    showToc
                    options={{ gfm: true, math: true, emoji: true }}
                  />
                ) : (
                  <MarkdownEditor
                    initialValue={demoSource}
                    options={{ gfm: true, math: true, emoji: true }}
                  />
                )}
              </div>
            </div>
          </MarkdownProvider>
        </div>
      </section>

      {/* Code Examples */}
      <section className="code-examples" id="code">
        <div className="container">
          <div className="section-header reveal">
            <h2>{t.code.heading}</h2>
            <p>{t.code.subheading}</p>
          </div>
          <div>
            <div className="code-tabs-bar">
              {(Object.keys(CODE_EXAMPLES) as (keyof typeof CODE_EXAMPLES)[]).map((key) => (
                <button
                  key={key}
                  className={`showcase-tab ${codeTab === key ? 'active' : ''}`}
                  onClick={() => setCodeTab(key)}
                >
                  {t.code.tabLabels[key]}
                </button>
              ))}
            </div>
            <div className="code-example-card" style={{ borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <pre>{CODE_EXAMPLES[codeTab]}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2 className="reveal">{t.cta.heading}</h2>
          <p className="reveal">{t.cta.subheading}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer">
              {t.cta.getStarted}
            </a>
            <a className="btn btn-secondary" href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer">
              {t.cta.viewDocs}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <div className="footer-brand">
                <span className="nav-logo">A</span>
                Markdown
              </div>
              <p className="footer-desc">{t.footer.desc}</p>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">{t.footer.resources}</span>
              <a href="https://github.com/xcancloud/Markdown#readme" target="_blank" rel="noopener noreferrer">{t.footer.docs}</a>
              <a href="https://github.com/xcancloud/Markdown/releases" target="_blank" rel="noopener noreferrer">{t.footer.changelog}</a>
              <a href="https://github.com/xcancloud/Markdown/tree/main/website" target="_blank" rel="noopener noreferrer">{t.footer.examples}</a>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">{t.footer.community}</span>
              <a href="https://github.com/xcancloud/Markdown/issues" target="_blank" rel="noopener noreferrer">{t.footer.issues}</a>
              <a href="https://github.com/xcancloud/Markdown/discussions" target="_blank" rel="noopener noreferrer">{t.footer.discussions}</a>
              <a href="https://github.com/xcancloud/Markdown/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">{t.footer.contributing}</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t.footer.copyright}</p>
            <div className="footer-bottom-links">
              <a href="https://github.com/xcancloud/Markdown/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
              <a href="https://github.com/xcancloud" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
