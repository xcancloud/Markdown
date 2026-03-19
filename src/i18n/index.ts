export type Locale = 'zh-CN' | 'en-US';

export interface I18nMessages {
  // Toolbar tooltips
  toolbar: {
    bold: string;
    italic: string;
    strikethrough: string;
    heading: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    quote: string;
    code: string;
    codeblock: string;
    link: string;
    image: string;
    table: string;
    ul: string;
    ol: string;
    task: string;
    hr: string;
    math: string;
    undo: string;
    redo: string;
    preview: string;
    fullscreen: string;
    layout: string;
    'layout_preview-only': string;
    'layout_editor-only': string;
    layout_split: string;
  };
  // Editor
  editor: {
    placeholder: string;
    uploading: string;
    uploadSuccess: string;
    uploadFailed: string;
    autoSaved: string;
  };
  // Renderer
  renderer: {
    copyCode: string;
    copied: string;
    renderError: string;
    loading: string;
    download: string;
    preview: string;
    closePreview: string;
  };
  // TOC
  toc: {
    title: string;
    noHeadings: string;
  };
  // Theme
  theme: {
    light: string;
    dark: string;
    auto: string;
  };
}

const zhCN: I18nMessages = {
  toolbar: {
    bold: '加粗',
    italic: '斜体',
    strikethrough: '删除线',
    heading: '标题',
    h1: '一级标题',
    h2: '二级标题',
    h3: '三级标题',
    h4: '四级标题',
    h5: '五级标题',
    quote: '引用',
    code: '行内代码',
    codeblock: '代码块',
    link: '链接',
    image: '图片',
    table: '表格',
    ul: '无序列表',
    ol: '有序列表',
    task: '任务列表',
    hr: '分割线',
    math: '数学公式',
    undo: '撤销',
    redo: '重做',
    preview: '预览',
    fullscreen: '全屏',
    layout: '布局',
    'layout_preview-only': '预览',
    'layout_editor-only': '编辑',
    layout_split: '分屏',
  },
  editor: {
    placeholder: '开始输入 Markdown...',
    uploading: '上传中...',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    autoSaved: '已自动保存',
  },
  renderer: {
    copyCode: '复制',
    copied: '已复制！',
    renderError: '渲染错误：',
    loading: '渲染中...',
    download: '下载',
    preview: '预览',
    closePreview: '关闭',
  },
  toc: {
    title: '目录',
    noHeadings: '暂无标题',
  },
  theme: {
    light: '浅色',
    dark: '深色',
    auto: '跟随系统',
  },
};

const enUS: I18nMessages = {
  toolbar: {
    bold: 'Bold',
    italic: 'Italic',
    strikethrough: 'Strikethrough',
    heading: 'Heading',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    quote: 'Quote',
    code: 'Inline Code',
    codeblock: 'Code Block',
    link: 'Link',
    image: 'Image',
    table: 'Table',
    ul: 'Unordered List',
    ol: 'Ordered List',
    task: 'Task List',
    hr: 'Horizontal Rule',
    math: 'Math Formula',
    undo: 'Undo',
    redo: 'Redo',
    preview: 'Preview',
    fullscreen: 'Fullscreen',
    layout: 'Layout',
    'layout_preview-only': 'Preview',
    'layout_editor-only': 'Editor',
    layout_split: 'Split',
  },
  editor: {
    placeholder: 'Start typing Markdown...',
    uploading: 'Uploading...',
    uploadSuccess: 'Upload successful',
    uploadFailed: 'Upload failed',
    autoSaved: 'Auto-saved',
  },
  renderer: {
    copyCode: 'Copy',
    copied: 'Copied!',
    renderError: 'Render Error:',
    loading: 'Rendering...',
    download: 'Download',
    preview: 'Preview',
    closePreview: 'Close',
  },
  toc: {
    title: 'Table of Contents',
    noHeadings: 'No headings',
  },
  theme: {
    light: 'Light',
    dark: 'Dark',
    auto: 'System',
  },
};

const locales: Record<Locale, I18nMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

let currentLocale: Locale = 'en-US';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(): I18nMessages {
  return locales[currentLocale];
}

export function getMessages(locale: Locale): I18nMessages {
  return locales[locale];
}
