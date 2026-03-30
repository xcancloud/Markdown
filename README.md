<div align="center">

# Markdown

[![npm version](https://img.shields.io/npm/v/@xcan-cloud/markdown?style=flat-square)](https://www.npmjs.com/package/@xcan-cloud/markdown)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![React 18+](https://img.shields.io/badge/react-%3E%3D18-61dafb?style=flat-square)](https://react.dev/)

Production-grade, extensible Markdown **rendering** and **editing** for React — CommonMark & GFM, math, Mermaid, Shiki highlighting, CodeMirror editor, themes, and i18n in one package.

[English](./README.md) · [简体中文](./README.zh-CN.md) · [Repository](https://github.com/xcancloud/Markdown) · [npm](https://www.npmjs.com/package/@xcan-cloud/markdown)

<br />

<img src="./editor.png" alt="Markdown Editor — toolbar, split preview with syntax highlighting, math, tables, task lists, alerts, and TOC sidebar" width="920" />

<br />

</div>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [ProcessorOptions](#processoroptions)
- [Exported Utilities](#exported-utilities)
- [Hooks](#hooks)
- [Component Architecture](#component-architecture)
- [Sub-Projects](#sub-projects)
- [Customization](#customization)
- [Technology Stack](#technology-stack)
- [Browser Support](#browser-support)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **CommonMark & GFM** — Tables, task lists, strikethrough, footnotes, autolinks
- **Syntax Highlighting** — 30+ languages via [Shiki](https://shiki.style/) (VS Code–quality themes)
- **Math** — Inline and block KaTeX (`$...$`, `$$...$$`)
- **Mermaid** — Flowcharts, sequence, Gantt, class diagrams (lazy client render)
- **SVG Preview** — Fenced ` ```svg ` or ` ```xml ` with SVG content renders as a **sanitized** inline preview (copy / download when not streaming)
- **Rich Editor** — CodeMirror 6, toolbar, split/tabs layouts, image paste/drop, auto-save, shortcuts
- **Code Block UX** — Copy, download (language-based extension; optional `file:` / comment meta for filename), HTML sandbox preview
- **GFM Alerts & Containers** — `> [!NOTE]` / `> [!WARNING]` and `:::tip` / `:::warning` directives
- **TOC Sidebar** — Auto-generated outline with active heading tracking (`MarkdownRenderer`)
- **Front Matter** — YAML (and TOML) metadata via remark-frontmatter
- **Emoji** — `:smile:` shortcodes (remark-emoji)
- **Security** — rehype-sanitize schema, URL handling, XSS-oriented defaults
- **Accessibility** — rehype a11y helpers, ARIA-oriented output
- **Streaming** — `streaming` prop for live SSE/chunked content (debounce bypass, cursor affordance)
- **Themes** — Light / Dark / Auto mode + `ThemeVariant` skin system (Default / Angus / GitHub); CSS variables throughout
- **i18n** — `en-US` and `zh-CN` built-in
- **Dual Build** — ESM + CJS, TypeScript declarations, tree-shakeable entry

## Quick Start

### Installation

```bash
npm install @xcan-cloud/markdown
```

Peer dependencies:

```bash
npm install react react-dom
```

Import styles once in your app:

```tsx
import '@xcan-cloud/markdown/styles';
```

> This single import includes both the renderer and editor styles.
> Optional theme presets are imported separately (see [Customization](#customization)).

### Basic Rendering

```tsx
import { MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return <MarkdownRenderer source="# Hello\n\nThis is **Markdown**." />;
}
```

### Editor (split view)

```tsx
import { MarkdownEditor } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return (
    <MarkdownEditor
      initialValue="# Start editing…"
      layout="split"
      onChange={(value) => console.log(value)}
    />
  );
}
```

### Theme & Locale Provider

```tsx
import {
  MarkdownProvider,
  MarkdownEditor,
  ThemeSwitcher,
  LocaleSwitcher,
} from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return (
    // defaultVariant="angus" — angus.css is already bundled inside @xcan-cloud/markdown/styles
    <MarkdownProvider defaultTheme="auto" defaultVariant="angus" defaultLocale="en-US">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <ThemeSwitcher />   {/* switches light / dark / auto */}
        <LocaleSwitcher />
      </div>
      <MarkdownEditor initialValue="# Hello" layout="split" />
    </MarkdownProvider>
  );
}
```

### SSR-Friendly Viewer (no CodeMirror)

```tsx
import { MarkdownViewer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function Page({ markdown }: { markdown: string }) {
  return <MarkdownViewer source={markdown} theme="light" />;
}
```

## API Reference

### `<MarkdownRenderer />`

Full-featured renderer: TOC, Mermaid/SVG post-processing, code actions, streaming.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | `string` | — | Markdown source |
| `options` | `ProcessorOptions` | — | Unified pipeline options |
| `className` | `string` | `''` | Root element class |
| `theme` | `'light' \| 'dark' \| 'auto'` | from context / `'auto'` | Color mode |
| `showToc` | `boolean` | `true` | Show TOC sidebar |
| `tocPosition` | `'left' \| 'right'` | `'right'` | TOC placement |
| `debounceMs` | `number` | `150` | Render debounce (disabled while `streaming`) |
| `onRendered` | `(info: { html: string; toc: TocItem[] }) => void` | — | After successful render |
| `onLinkClick` | `(href: string, event: MouseEvent) => void` | — | Link click hook |
| `onImageClick` | `(src: string, alt: string, event: MouseEvent) => void` | — | Image click hook |
| `components` | `Partial<Record<string, ComponentType<any>>>` | — | Custom HTML tag mapping |
| `streaming` | `boolean` | `false` | Live stream mode |
| `onStreamEnd` | `() => void` | — | Fired when `streaming` goes `true` → `false` |
| `height` | `string` | — | Fixed height of the renderer container |
| `minHeight` | `string` | — | Minimum height of the renderer container |
| `maxHeight` | `string` | — | Maximum height of the renderer container |

### `<MarkdownEditor />`

Extends renderer props **except** `source` is replaced by editor value APIs.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initialValue` | `string` | `''` | Initial markdown |
| `value` | `string` | — | Controlled value |
| `onChange` | `(value: string) => void` | — | Content change |
| `layout` | `LayoutMode` | `'split'` | `split` \| `tabs` \| `editor-only` \| `preview-only` |
| `minHeight` / `maxHeight` | `string` | — | Editor area sizing |
| `toolbar` | `ToolbarConfig` | default set | `false` to hide, or item list |
| `readOnly` | `boolean` | `false` | Read-only editor |
| `onImageUpload` | `(file: File) => Promise<string>` | — | Return URL for pasted/dropped images |
| `onAutoSave` | `(value: string) => void` | — | Periodic save callback |
| `autoSaveInterval` | `number` | `30000` | Auto-save interval (ms) |
| `extensions` | `Extension[]` | `[]` | Extra CodeMirror extensions |
| `shortcuts` | `ShortcutMap` | — | Custom keymap handlers |
| `maxLength` | `number` | — | Hard limit + counter UI |

All **`MarkdownRenderer`** props except `source` also apply to the preview pane (e.g. `options`, `theme`, `showToc`).

### `<MarkdownViewer />`

Lightweight viewer using `useMarkdown` (no CodeMirror).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | `string` | — | Markdown source |
| `options` | `ProcessorOptions` | — | Pipeline options |
| `className` | `string` | `''` | Root class |
| `theme` | `'light' \| 'dark' \| 'auto'` | from context | Theme |
| `onRendered` | `(info: { html: string; toc: TocItem[] }) => void` | — | Note: `toc` is `[]` in viewer |
| `height` | `string` | — | Fixed height of the viewer container |
| `minHeight` | `string` | — | Minimum height of the viewer container |
| `maxHeight` | `string` | — | Maximum height of the viewer container |

### `<MarkdownProvider />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | App subtree |
| `defaultTheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Light/dark mode |
| `defaultVariant` | `'default' \| 'angus' \| 'github'` | `'angus'` | Visual skin |
| `defaultLocale` | `'en-US' \| 'zh-CN'` | `'en-US'` | Initial locale |

### `<ThemeSwitcher />` / `<LocaleSwitcher />`

Optional controls; read/write theme and locale via `useTheme()` / `useLocale()`.

### TypeScript (core props)

```tsx
interface MarkdownRendererProps {
  source: string;
  options?: ProcessorOptions;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  showToc?: boolean;
  tocPosition?: 'left' | 'right';
  debounceMs?: number;
  onRendered?: (info: { html: string; toc: TocItem[] }) => void;
  onLinkClick?: (href: string, event: React.MouseEvent) => void;
  onImageClick?: (src: string, alt: string, event: React.MouseEvent) => void;
  components?: Partial<Record<string, React.ComponentType<any>>>;
  streaming?: boolean;
  onStreamEnd?: () => void;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}
```

## ProcessorOptions

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `gfm` | `boolean` | `true` | GitHub Flavored Markdown |
| `math` | `boolean` | `true` | KaTeX |
| `mermaid` | `boolean` | `true` | Mermaid code blocks |
| `frontmatter` | `boolean` | `true` | YAML/TOML front matter |
| `emoji` | `boolean` | `true` | Emoji shortcodes |
| `toc` | `boolean` | `false` | `[[toc]]` / `[toc]` replacement |
| `sanitize` | `boolean` | `true` | HTML sanitization |
| `sanitizeSchema` | `Schema` | internal | Custom rehype-sanitize schema |
| `codeTheme` | `string` | `'github-dark'` | Shiki theme |
| `highlight` | `boolean` | `true` | Shiki highlighting (async pipeline) |
| `allowHtml` | `boolean` | `true` | Raw HTML path through remark-rehype |
| `remarkPlugins` | `Plugin[]` | `[]` | Extra remark plugins |
| `rehypePlugins` | `Plugin[]` | `[]` | Extra rehype plugins |

## Exported Utilities

| Export | Description |
| --- | --- |
| `createProcessor`, `renderMarkdown`, `renderMarkdownSync`, `parseToAst` | Core unified pipeline |
| `ProcessorOptions` | Pipeline configuration type |
| `rehypeHighlightCode` | Shiki highlighting rehype plugin |
| `renderMermaidDiagram`, `initMermaid` | Client Mermaid helpers |
| `extractToc`, `remarkToc`, `TocItem` | TOC extraction / remark plugin |
| `remarkAlert`, `remarkContainer`, `remarkCodeMeta` | Alert, container, code-meta remark plugins |
| `parseCodeMeta`, `extractCodeBlocks`, `CodeBlockMeta` | Fence meta parsing |
| `sanitizeUrl`, `processExternalLinks`, `escapeHtml` | Security helpers |
| `rehypeA11y` | Accessibility rehype plugin |
| `MarkdownWorkerRenderer`, `RenderCache`, `splitHtmlBlocks` | Worker / cache utilities |
| `copyToClipboard` | Clipboard helper |
| `slug`, `resetSlugger` | Heading slug utilities |
| `setLocale`, `getLocale`, `t`, `getMessages` | i18n API |
| `ThemeVariant`, `resolveThemeClass` | Skin type and CSS-class resolver |

## Hooks

| Hook | Description |
| --- | --- |
| `useMarkdown(source, options?)` | Returns `{ html, toc, isLoading, error, refresh }` |
| `useDebouncedValue(value, delay)` | Debounced value |
| `useScrollSync(editorRef, previewRef)` | Bi-directional scroll sync |

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MarkdownProvider                            │
│              (theme / locale context)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
 │ MarkdownEditor│  │MarkdownRenderer│ │ MarkdownViewer  │
 │ ┌──────────┐ │  │ • unified +    │  │ • useMarkdown    │
 │ │ CodeMirror│ │  │   Shiki/KaTeX  │  │ • no CM dep      │
 │ │ + Toolbar │ │  │ • TOC sidebar  │  └──────────────────┘
 │ └──────────┘ │  │ • Mermaid/SVG  │
 │ ┌──────────┐ │  │ • code actions │
 │ │ Preview  │◄┼──┤   (copy/…)     │
 │ │ (Renderer)│ │  └────────────────┘
 │ └──────────┘ │
 └──────────────┘
```

## Sub-Projects

| Path | Description |
| --- | --- |
| [`website/`](./website/) | Vite dev playground / demo app for local development |
| [`src/styles/`](./src/styles/) | Base `markdown-renderer.css` and theme presets (`themes/github.css`, `themes/angus.css`) |

## Customization

### Themes

The theme system has two orthogonal dimensions:

- **`defaultTheme`** — brightness mode: `'light'`, `'dark'`, `'auto'` (follows `prefers-color-scheme`)
- **`defaultVariant`** — visual skin: `'default'`, `'angus'`, `'github'`

The combination maps to a single CSS class on the root container:

| variant \ mode | `light` | `dark` |
| --- | --- | --- |
| `default` | `markdown-theme-light` | `markdown-theme-dark` |
| `angus` | `markdown-theme-angus` | `markdown-theme-angus-dark` |
| `github` | `markdown-theme-github` | `markdown-theme-github-dark` |

#### Default skin (light / dark toggle)

```tsx
import '@xcan-cloud/markdown/styles';
import { MarkdownProvider, MarkdownRenderer } from '@xcan-cloud/markdown';

function App() {
  return (
    <MarkdownProvider defaultTheme="auto">
      <MarkdownRenderer source="# Hello" />
    </MarkdownProvider>
  );
}
```

#### Angus skin

The Angus skin CSS is **bundled inside** `@xcan-cloud/markdown/styles` — no extra import needed.

```tsx
import '@xcan-cloud/markdown/styles';
import { MarkdownProvider, MarkdownEditor, ThemeSwitcher } from '@xcan-cloud/markdown';

function App() {
  return (
    // defaultVariant="angus": light mode → markdown-theme-angus
    //                          dark mode  → markdown-theme-angus-dark
    <MarkdownProvider defaultTheme="auto" defaultVariant="angus">
      <ThemeSwitcher />
      <MarkdownEditor initialValue="# Hello" layout="split" />
    </MarkdownProvider>
  );
}
```

#### GitHub skin

The GitHub skin requires an additional CSS import:

```tsx
import '@xcan-cloud/markdown/styles';
import '@xcan-cloud/markdown/themes/github.css';   // ← extra import required
import { MarkdownProvider, MarkdownRenderer } from '@xcan-cloud/markdown';

function App() {
  return (
    // defaultVariant="github": light mode → markdown-theme-github
    //                           dark mode  → markdown-theme-github-dark
    <MarkdownProvider defaultTheme="light" defaultVariant="github">
      <MarkdownRenderer source="# Hello" />
    </MarkdownProvider>
  );
}
```

#### Switching variant at runtime

```tsx
import { useTheme } from '@xcan-cloud/markdown';

function VariantSwitcher() {
  const { variant, setVariant } = useTheme();
  return (
    <select value={variant} onChange={(e) => setVariant(e.target.value as any)}>
      <option value="default">Default</option>
      <option value="angus">Angus</option>
      <option value="github">GitHub</option>
    </select>
  );
}
```

### CSS variables

Override tokens on `.markdown-renderer` (see stylesheet for `--md-*` variables).

### i18n

```tsx
<MarkdownProvider defaultLocale="zh-CN">
  <MarkdownEditor initialValue="# 你好" />
</MarkdownProvider>
```

```tsx
import { setLocale, t } from '@xcan-cloud/markdown';

setLocale('zh-CN');
```

### Toolbar

```tsx
<MarkdownEditor toolbar={false} />
<MarkdownEditor toolbar={['bold', 'italic', '|', 'code']} />
```

### Height

```tsx
// Fixed height
<MarkdownRenderer source={md} height="600px" />
<MarkdownViewer source={md} height="400px" />

// Min / max height
<MarkdownRenderer source={md} minHeight="200px" maxHeight="80vh" />

// Editor CodeMirror pane height
<MarkdownEditor minHeight="300px" maxHeight="700px" />
```

### Code fence meta

````markdown
```python filename=hello.py
print("hi")
```
````

Use `parseCodeMeta` / `extractCodeBlocks` for external tooling.

## Technology Stack

| Category | Technologies |
| --- | --- |
| Framework | React 18+, TypeScript |
| Markdown | unified, remark, rehype, remark-gfm, remark-math, … |
| Highlighting | Shiki |
| Diagrams | Mermaid (client), KaTeX |
| Editor | CodeMirror 6 |
| Icons | lucide-react |
| Build | Vite, vite-plugin-dts |

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 major versions). Features like `fetch` streams / Workers follow browser capabilities.

## Development

```bash
npm install
npm run dev      # website demo
npm run build    # library dist
npm test
npm run lint     # tsc --noEmit
```

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`.
3. Commit with clear messages.
4. Push and open a Pull Request.

Please ensure `npm run lint` and `npm run build` pass before submitting.

## License

[MIT](./LICENSE) © Markdown package contributors
