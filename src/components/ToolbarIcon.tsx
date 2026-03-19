import React from 'react';

/* SVG icons for layout buttons (16×16) */
const svgIcons: Record<string, React.ReactNode> = {
  'layout-editor-only': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="8.5" x2="10" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  'layout-split': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="2.5" x2="8" y2="13.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  'layout-preview-only': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 10.5C9.38 10.5 11.5 9.27 11.5 8C11.5 6.73 9.38 5.5 8 5.5C6.62 5.5 4.5 6.73 4.5 8C4.5 9.27 6.62 10.5 8 10.5Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  ),
  'code': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="5.5" x2="12" y2="5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
};

const textIcons: Record<string, string> = {
  bold: 'B',
  italic: 'I',
  strikethrough: 'S',
  heading: 'H',
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  quote: '❝',
  codeblock: '</>',
  link: '🔗',
  image: '🖼',
  table: '⊞',
  ul: '•',
  ol: '1.',
  task: '☑',
  hr: '―',
  math: '∑',
  undo: '↩',
  redo: '↪',
  preview: '👁',
  fullscreen: '⛶',
  layout: '⊞',
};

export const ToolbarIcon: React.FC<{ name: string }> = ({ name }) => {
  if (svgIcons[name]) {
    return <span className="toolbar-icon toolbar-icon-svg">{svgIcons[name]}</span>;
  }
  return <span className="toolbar-icon">{textIcons[name] ?? name}</span>;
};

export default ToolbarIcon;
