import React, { useState, useCallback } from 'react';
import {
  MarkdownProvider,
  MarkdownRenderer,
  MarkdownEditor,
  ThemeSwitcher,
  LocaleSwitcher,
} from '@xcancloud/markdown';
import '../../src/styles/markdown-renderer.css';
import '../../src/styles/markdown-editor.css';
import '../../src/styles/themes/github.css';
import '../../src/styles/themes/notion.css';
import '../../src/styles/themes/typora.css';

// ============================================================
// i18n content
// ============================================================
type SiteLang = 'en' | 'zh';

const SITE_TEXT = {
  en: {
    nav: { features: 'Features', demo: 'Demo', code: 'Code', github: 'GitHub' },
    hero: {
      badge: 'v1.0.0 — Production Ready',
      title1: 'The ',
      titleHighlight: 'Markdown Component',
      title2: ' for Modern React Apps',
      subtitle:
        'A production-grade, extensible, high-performance Markdown rendering & editing component with theme system, i18n, and 30+ language syntax highlighting.',
      liveDemo: 'Live Demo',
    },
    stats: [
      { value: '30+', label: 'Supported Languages' },
      { value: '3', label: 'Built-in Themes' },
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
        { icon: '🔧', color: '#e8eaf6', title: 'Rich Editor', desc: 'CodeMirror 6 with toolbar, image paste & drop, auto-save, split/tab layouts.' },
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
      },
    },
    cta: {
      heading: 'Ready to Build?',
      subheading: 'Start using Markdown in your project today.',
      getStarted: 'Get Started',
      viewDocs: 'View Documentation',
    },
    footer: 'Markdown v1.0.0 — MIT License — Built with React + unified',
  },
  zh: {
    nav: { features: '特性', demo: '演示', code: '代码', github: 'GitHub' },
    hero: {
      badge: 'v1.0.0 — 生产就绪',
      title1: '现代 React 应用的',
      titleHighlight: 'Markdown 组件',
      title2: '',
      subtitle:
        '一个生产级、可扩展、高性能的 Markdown 渲染与编辑组件，内置主题系统、国际化和 30+ 语言语法高亮。',
      liveDemo: '在线演示',
    },
    stats: [
      { value: '30+', label: '支持语言' },
      { value: '3', label: '内置主题' },
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
        { icon: '🔧', color: '#e8eaf6', title: '丰富编辑器', desc: '基于 CodeMirror 6，支持工具栏、图片粘贴与拖拽、自动保存、多布局模式。' },
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
      },
    },
    cta: {
      heading: '准备好开始了吗？',
      subheading: '今天就在你的项目中使用 AngusMarkdown。',
      getStarted: '快速开始',
      viewDocs: '查看文档',
    },
    footer: 'Markdown v1.0.0 — MIT 许可证 — 基于 React + unified 构建',
  },
};

// ============================================================
// Demo Markdown (bilingual)
// ============================================================
const DEMO_SOURCE_EN = `# Welcome to Markdown

## Features Showcase

Markdown supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Code Highlighting

\`\`\`typescript
import { MarkdownEditor } from '@xcancloud/markdown';

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

\`\`\`typescript
import { MarkdownEditor } from '@xcancloud/markdown';

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
  basic: `import { MarkdownRenderer } from '@xcancloud/markdown';
import '@xcancloud/markdown/styles';

function App() {
  return (
    <MarkdownRenderer
      source="# Hello World"
      theme="auto"
      showToc
    />
  );
}`,
  editor: `import { MarkdownEditor } from '@xcancloud/markdown';
import '@xcancloud/markdown/styles';

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
} from '@xcancloud/markdown';

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
  hook: `import { useMarkdown } from '@xcancloud/markdown';

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
import { MarkdownRenderer } from '@xcancloud/markdown';
import '@xcancloud/markdown/styles';

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
};

// ============================================================
// App Component
// ============================================================

type ShowcaseTab = 'renderer' | 'editor';
type StyleTheme = 'default' | 'github' | 'notion' | 'typora';

const STYLE_THEMES: { value: StyleTheme; label: { en: string; zh: string } }[] = [
  { value: 'default', label: { en: 'Default', zh: '默认' } },
  { value: 'github', label: { en: 'GitHub', zh: 'GitHub' } },
  { value: 'notion', label: { en: 'Notion', zh: 'Notion' } },
  { value: 'typora', label: { en: 'Typora', zh: 'Typora' } },
];

const App: React.FC = () => {
  const [lang, setLang] = useState<SiteLang>('en');
  const [showcaseTab, setShowcaseTab] = useState<ShowcaseTab>('renderer');
  const [codeTab, setCodeTab] = useState<keyof typeof CODE_EXAMPLES>('basic');
  const [copied, setCopied] = useState(false);
  const [styleTheme, setStyleTheme] = useState<StyleTheme>('default');

  const t = SITE_TEXT[lang];
  const demoSource = lang === 'zh' ? DEMO_SOURCE_ZH : DEMO_SOURCE_EN;
  const componentLocale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const styleClassName = styleTheme !== 'default' ? `markdown-theme-${styleTheme}` : '';

  const toggleLang = useCallback(() => {
    setLang((l) => (l === 'en' ? 'zh' : 'en'));
  }, []);

  const handleCopyInstall = useCallback(() => {
    navigator.clipboard.writeText('npm install @xcancloud/markdown').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

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
            <a href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer">
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
            <code>npm install @xcancloud/markdown</code>
            <button className="copy-btn" onClick={handleCopyInstall} aria-label="Copy install command">
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {t.stats.map((s) => (
              <div key={s.label} className="stat-item">
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
          <div className="feature-grid">
            {t.features.items.map((f) => (
              <div key={f.title} className="feature-card">
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
          <div className="section-header">
            <h2>{t.demo.heading}</h2>
            <p>{t.demo.subheading}</p>
          </div>
          <MarkdownProvider defaultTheme="light" defaultLocale={componentLocale}>
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
                    className={styleClassName}
                    options={{ gfm: true, math: true, emoji: true }}
                  />
                ) : (
                  <MarkdownEditor
                    initialValue={demoSource}
                    className={styleClassName}
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
          <div className="section-header">
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
          <h2>{t.cta.heading}</h2>
          <p>{t.cta.subheading}</p>
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
          <div className="footer-links">
            <a href="https://github.com/xcancloud/Markdown" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/xcancloud/Markdown/issues" target="_blank" rel="noopener noreferrer">Issues</a>
            <a href="https://github.com/xcancloud/Markdown/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">License</a>
          </div>
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
