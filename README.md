<p align="center">
  <img src="https://img.shields.io/npm/v/@angus/markdown?color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/l/@angus/markdown" alt="license" />
  <img src="https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb" alt="react" />
  <img src="https://img.shields.io/badge/typescript-5.x-3178c6" alt="typescript" />
</p>

# AngusMarkdown

> Production-grade, extensible, high-performance Markdown rendering & editing component for React.

---

## Features

- **Full Markdown Support** — CommonMark, GFM (tables, task lists, strikethrough, footnotes, alerts)
- **Syntax Highlighting** — 30+ languages via [Shiki](https://shiki.style/) with VS Code-level quality
- **Math Rendering** — Inline & block KaTeX formulas (`$...$` and `$$...$$`)
- **Mermaid Diagrams** — Flowcharts, sequence, gantt, class diagrams (lazy-loaded)
- **Rich Editor** — CodeMirror 6 with toolbar, image paste/drop, auto-save, customizable shortcuts
- **Theme System** — Light / Dark / Auto (system) with CSS Custom Properties
- **Internationalization** — Built-in `en-US` and `zh-CN` locale support
- **TOC Generation** — Auto-generated Table of Contents sidebar with active heading tracking
- **Custom Containers** — `:::warning`, `:::tip`, `:::note` directives
- **GFM Alerts** — `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, etc.
- **Emoji Support** — `:smile:` → 😄
- **Front Matter** — YAML metadata parsing
- **Security** — HTML sanitization, URL sanitization, XSS prevention
- **Accessibility** — ARIA roles, keyboard navigation, screen reader support
- **Performance** — Debounced rendering, Web Worker support, render caching
- **Three Themes** — GitHub, Notion, Typora presets
- **Dual Output** — ESM + CJS with full TypeScript types
- **Tree-shakeable** — Import only what you need

---

## Installation

```bash
npm install @angus/markdown
# or
yarn add @angus/markdown
# or
pnpm add @angus/markdown
```

Peer dependencies:

```bash
npm install react react-dom
```

---

## Quick Start

### Basic Rendering

```tsx
import { MarkdownRenderer } from '@angus/markdown';
import '@angus/markdown/styles';

function App() {
  return <MarkdownRenderer source="# Hello World\n\nThis is **AngusMarkdown**!" />;
}
```

### Full Editor

```tsx
import { MarkdownEditor } from '@angus/markdown';
import '@angus/markdown/styles';

function App() {
  return (
    <MarkdownEditor
      initialValue="# Start editing..."
      layout="split"
      onChange={(value) => console.log(value)}
    />
  );
}
```

### With Theme & i18n Provider

```tsx
import {
  MarkdownProvider,
  MarkdownEditor,
  ThemeSwitcher,
  LocaleSwitcher,
} from '@angus/markdown';
import '@angus/markdown/styles';

function App() {
  return (
    <MarkdownProvider defaultTheme="auto" defaultLocale="en-US">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
      <MarkdownEditor initialValue="# Hello!" layout="split" />
    </MarkdownProvider>
  );
}
```

### Hook Usage

```tsx
import { useMarkdown } from '@angus/markdown';

function MyComponent() {
  const { html, toc, isLoading, error } = useMarkdown('# Hello', {
    gfm: true,
    math: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

---

## Components

### `<MarkdownRenderer />`

Full-featured renderer with TOC sidebar, Mermaid post-processing, and copy buttons.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string` | — | Markdown source text |
| `options` | `ProcessorOptions` | `{}` | Processor pipeline options |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `showToc` | `boolean` | `true` | Show TOC sidebar |
| `tocPosition` | `'left' \\| 'right'` | `'right'` | TOC sidebar position |
| `debounceMs` | `number` | `150` | Debounce delay (ms) |
| `className` | `string` | `''` | Custom CSS class |
| `onRendered` | `(info) => void` | — | Callback after render |
| `onLinkClick` | `(href, event) => void` | — | Link click interceptor |
| `onImageClick` | `(src, alt, event) => void` | — | Image click handler |
| `components` | `Partial<ComponentMap>` | — | Custom element renderers |

### `<MarkdownEditor />`

CodeMirror 6-based editor with toolbar, split/tab layouts, image paste & drop.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `string` | `''` | Initial content |
| `value` | `string` | — | Controlled value |
| `onChange` | `(value) => void` | — | Change callback |
| `layout` | `'split' \| 'tabs' \| 'editor-only' \| 'preview-only'` | `'split'` | Layout mode |
| `toolbar` | `ToolbarConfig` | `{ show: true }` | Toolbar configuration |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `onImageUpload` | `(file) => Promise<string>` | — | Image upload handler |
| `onAutoSave` | `(value) => void` | — | Auto-save callback |
| `autoSaveInterval` | `number` | `30000` | Auto-save interval (ms) |
| `extensions` | `Extension[]` | `[]` | Additional CM extensions |

### `<MarkdownViewer />`

Lightweight SSR-friendly viewer (no CodeMirror dependency).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string` | — | Markdown source text |
| `options` | `ProcessorOptions` | `{}` | Processor options |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `className` | `string` | `''` | Custom CSS class |

### `<ThemeSwitcher />`

Toggle between Light / Dark / Auto themes. Uses `useTheme()` context.

### `<LocaleSwitcher />`

Toggle between `en-US` and `zh-CN`. Uses `useLocale()` context.

### `<MarkdownProvider />`

Context provider for theme and locale. Wrap your app or section with this.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `ThemeMode` | `'auto'` | Initial theme |
| `defaultLocale` | `Locale` | `'en-US'` | Initial locale |

---

## Theming

AngusMarkdown uses CSS Custom Properties for theming. Three built-in themes:

```tsx
// GitHub style (default)
import '@angus/markdown/styles';

// Notion style
import '@angus/markdown/themes/notion.css';

// Typora style
import '@angus/markdown/themes/typora.css';
```

### Custom Theme

Override CSS variables:

```css
.markdown-renderer {
  --md-bg: #fafafa;
  --md-text: #333;
  --md-link: #0077cc;
  --md-code-bg: #f0f0f0;
  --md-border: #ddd;
  /* ... */
}
```

---

## Internationalization (i18n)

Built-in locales: `en-US` and `zh-CN`.

```tsx
<MarkdownProvider defaultLocale="zh-CN">
  <MarkdownEditor initialValue="# 你好世界" />
</MarkdownProvider>
```

Or use programmatically:

```tsx
import { setLocale, t } from '@angus/markdown';

setLocale('zh-CN');
console.log(t().toolbar.bold); // "加粗"
```

---

## ProcessorOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gfm` | `boolean` | `true` | Enable GFM |
| `math` | `boolean` | `true` | Enable KaTeX math |
| `mermaid` | `boolean` | `true` | Enable Mermaid diagrams |
| `frontmatter` | `boolean` | `true` | Parse YAML front matter |
| `emoji` | `boolean` | `true` | Enable emoji shortcodes |
| `toc` | `boolean` | `false` | Enable `[[toc]]` directive |
| `sanitize` | `boolean` | `true` | Sanitize HTML output |
| `codeTheme` | `string` | `'github-dark'` | Shiki code theme |
| `allowHtml` | `boolean` | `true` | Allow raw HTML |
| `remarkPlugins` | `Plugin[]` | `[]` | Custom remark plugins |
| `rehypePlugins` | `Plugin[]` | `[]` | Custom rehype plugins |

---

## Hooks

### `useMarkdown(source, options?)`

Returns `{ html, toc, isLoading, error, refresh }`.

### `useDebouncedValue(value, delay)`

Debounces a value with the specified delay.

### `useScrollSync(editorRef, previewRef)`

Syncs scroll position between editor and preview panels.

---

## Project Structure

```
src/
├── components/           # React components
│   ├── MarkdownRenderer  # Full renderer with TOC, Mermaid, copy buttons
│   ├── MarkdownEditor    # CodeMirror 6 editor with toolbar
│   ├── MarkdownViewer    # Lightweight SSR-friendly viewer
│   ├── ThemeSwitcher     # Theme toggle component
│   ├── LocaleSwitcher    # Locale toggle component
│   └── ToolbarIcon       # Toolbar icon mapping
├── context/              # React Context providers
│   └── MarkdownProvider
├── core/                 # Processing pipeline
│   ├── processor         # unified pipeline
│   ├── plugins/          # remark/rehype plugins
│   ├── security          # URL sanitization, XSS prevention
│   ├── accessibility     # ARIA, a11y rehype plugin
│   └── performance       # Web Worker, cache, chunking
├── hooks/                # React hooks
├── i18n/                 # Internationalization messages
├── styles/               # CSS stylesheets & themes
└── utils/                # Clipboard, slug, sanitize utilities
```

---

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build library
npm run build

# Run tests
npm test

# Type check
npm run lint
```

---

## License

MIT