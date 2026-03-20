<p align="center">
  <img src="https://img.shields.io/npm/v/@xcan-cloud/markdown?color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/l/@xcan-cloud/markdown" alt="license" />
  <img src="https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb" alt="react" />
  <img src="https://img.shields.io/badge/typescript-5.x-3178c6" alt="typescript" />
</p>

# Markdown

> Production-grade, extensible, high-performance Markdown rendering & editing component for React.

---

## Features

- **Full Markdown Support** — CommonMark, GFM (tables, task lists, strikethrough, footnotes, alerts)
- **Syntax Highlighting** — 30+ languages via [Shiki](https://shiki.style/) with VS Code-level quality
- **Math Rendering** — Inline & block KaTeX formulas (`$...$` and `$$...$$`)
- **Mermaid Diagrams** — Flowcharts, sequence, gantt, class diagrams (lazy-loaded)
- **Rich Editor** — CodeMirror 6 with toolbar, image paste/drop, auto-save, customizable shortcuts
- **Lucide Icons** — Beautiful [lucide-react](https://lucide.dev/) icons in toolbar and code block actions
- **Code Block Extensions** — Extended attributes syntax (`filename=`, `dir=`, etc.) with parsing utilities
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
npm install @xcan-cloud/markdown
# or
yarn add @xcan-cloud/markdown
# or
pnpm add @xcan-cloud/markdown
```

Peer dependencies:

```bash
npm install react react-dom
```

---

## Quick Start

### Basic Rendering

```tsx
import { MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function App() {
  return <MarkdownRenderer source="# Hello World\n\nThis is **Markdown**!" />;
}
```

### Full Editor

```tsx
import { MarkdownEditor } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

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
} from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

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
import { useMarkdown } from '@xcan-cloud/markdown';

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

### SSE Streaming Integration

```tsx
import { useState, useEffect } from 'react';
import { MarkdownRenderer } from '@xcan-cloud/markdown';
import '@xcan-cloud/markdown/styles';

function StreamingDemo() {
  const [content, setContent] = useState('');
  const [streaming, setStreaming] = useState(false);

  const startStream = () => {
    setContent('');
    setStreaming(true);

    const eventSource = new EventSource('/api/chat/stream');

    eventSource.onmessage = (event) => {
      const token = JSON.parse(event.data).token;
      setContent((prev) => prev + token);
    };

    eventSource.addEventListener('done', () => {
      eventSource.close();
      setStreaming(false);
    });

    eventSource.onerror = () => {
      eventSource.close();
      setStreaming(false);
    };
  };

  return (
    <div>
      <button onClick={startStream} disabled={streaming}>
        {streaming ? 'Streaming...' : 'Start Stream'}
      </button>
      <MarkdownRenderer
        source={content}
        streaming={streaming}
        onStreamEnd={() => console.log('Stream ended')}
        showToc={false}
      />
    </div>
  );
}
```

You can also use `fetch` with streaming:

```tsx
async function fetchStream() {
  setContent('');
  setStreaming(true);

  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Hello' }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    setContent((prev) => prev + chunk);
  }

  setStreaming(false);
}
```

---

## Components

### `<MarkdownRenderer />`

Full-featured renderer with TOC sidebar, Mermaid post-processing, copy/download/preview buttons on code blocks, and SSE streaming support.

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
| `streaming` | `boolean` | `false` | Whether currently receiving streaming content (shows blinking cursor, bypasses debounce) |
| `onStreamEnd` | `() => void` | — | Callback fired when `streaming` transitions from `true` to `false` |

### `<MarkdownEditor />`

CodeMirror 6-based editor with toolbar, split/tab layouts, image paste & drop.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `string` | `''` | Initial content |
| `value` | `string` | — | Controlled value |
| `onChange` | `(value) => void` | — | Change callback |
| `layout` | `'split' \| 'tabs' \| 'editor-only' \| 'preview-only'` | `'split'` | Layout mode |
| `toolbar` | `ToolbarConfig` | — | Toolbar configuration (see below) |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `onImageUpload` | `(file) => Promise<string>` | — | Image upload handler |
| `onAutoSave` | `(value) => void` | — | Auto-save callback |
| `autoSaveInterval` | `number` | `30000` | Auto-save interval (ms) |
| `extensions` | `Extension[]` | `[]` | Additional CM extensions |
| `maxLength` | `number` | — | Maximum character count. When set, a counter is displayed below the editor and input beyond the limit is truncated |

#### Toolbar Configuration

The `toolbar` prop accepts several forms:

```tsx
// Hide toolbar completely
<MarkdownEditor toolbar={false} />

// Show only specific items
<MarkdownEditor toolbar={['bold', 'italic', '|', 'code', 'codeblock']} />

// Object form (legacy)
<MarkdownEditor toolbar={{ show: true, items: ['bold', 'italic'] }} />

// Default: show all toolbar items
<MarkdownEditor />
```

**Available `ToolbarItem` identifiers:**

`'bold'` | `'italic'` | `'strikethrough'` | `'heading'` | `'h1'`–`'h5'` | `'quote'` | `'code'` (inline) | `'codeblock'` (fenced) | `'link'` | `'image'` | `'table'` | `'ul'` | `'ol'` | `'task'` | `'hr'` | `'math'` | `'|'` (separator) | `'undo'` | `'redo'` | `'preview'` | `'fullscreen'` | `'layout'`

#### Character Limit

```tsx
<MarkdownEditor maxLength={500} onChange={(v) => console.log(v)} />
// Displays "128 / 500" counter below the editor
```

#### Code Block Actions

Code blocks in the rendered preview include action buttons powered by [lucide-react](https://lucide.dev/) icons:
- **Copy** (clipboard icon) — Copies code to clipboard with check-mark feedback
- **Download** (download icon) — Downloads code as `code-snippet.{ext}` (extension mapped from language identifier, e.g., `js` → `.js`, `python` → `.py`, fallback `.txt`)
- **Preview** (eye icon) — Only shown for `html` code blocks; renders HTML in a sandboxed iframe modal (`sandbox="allow-scripts"`, no `allow-same-origin`)

#### Code Block Extended Attributes

Code blocks support extended attributes in the fence line after the language identifier. Attributes are specified as `key=value` pairs:

**Standard syntax:**

````markdown
```python
print("Hello")
```
````

**Extended syntax with attributes:**

````markdown
```python filename=hello.py dir=src/hello.py
print("Hello")
```
````

Attributes are rendered as `data-*` attributes on the code block HTML element:

```html
<div class="code-block" data-language="python" data-meta="filename=hello.py dir=src/hello.py" data-filename="hello.py" data-dir="src/hello.py">
  ...
</div>
```

**Supported value formats:**

| Format | Example |
|--------|---------|
| Unquoted | `filename=hello.py` |
| Double-quoted | `filename="my file.py"` |
| Single-quoted | `filename='hello.py'` |
| Brace-enclosed | `highlight={1,3-5}` |

**Parsing utilities** — Use these functions to extract code block metadata externally:

```tsx
import { parseCodeMeta, extractCodeBlocks } from '@xcan-cloud/markdown';

// Parse a meta string
const attrs = parseCodeMeta('filename=hello.py dir=src');
// => { filename: 'hello.py', dir: 'src' }

// Extract all code blocks from Markdown source
const blocks = extractCodeBlocks(markdownSource);
blocks.forEach(block => {
  console.log(block.language);    // 'python'
  console.log(block.meta);        // 'filename=hello.py dir=src'
  console.log(block.attributes);  // { filename: 'hello.py', dir: 'src' }
  console.log(block.code);        // 'print("Hello")'
});
```

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

Markdown uses CSS Custom Properties for theming. Three built-in themes:

```tsx
// GitHub style (default)
import '@xcan-cloud/markdown/styles';

// Notion style
import '@xcan-cloud/markdown/themes/notion.css';

// Typora style
import '@xcan-cloud/markdown/themes/typora.css';
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
import { setLocale, t } from '@xcan-cloud/markdown';

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
│   └── ToolbarIcon       # Toolbar icon mapping (lucide-react)
├── context/              # React Context providers
│   └── MarkdownProvider
├── core/                 # Processing pipeline
│   ├── processor         # unified pipeline
│   ├── plugins/          # remark/rehype plugins
│   │   ├── remark-code-meta  # Code block extended attributes
│   │   └── ...
│   ├── utils/
│   │   ├── code-meta     # Code fence meta parsing utilities
│   │   └── code-download # Code download with language mapping
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
