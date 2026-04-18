import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading,
  Quote,
  Code,
  FileCode,
  Link,
  Image,
  Table,
  List,
  ListOrdered,
  ListChecks,
  Minus,
  Sigma,
  Undo2,
  Redo2,
  Eye,
  Maximize,
  Columns2,
  SquarePen,
  LayoutDashboard,
} from 'lucide-react';

const ICON_SIZE = 16;

/* lucide-react icons for toolbar buttons */
const lucideIcons: Record<string, React.ReactNode> = {
  bold: <Bold size={ICON_SIZE} />,
  italic: <Italic size={ICON_SIZE} />,
  strikethrough: <Strikethrough size={ICON_SIZE} />,
  heading: <Heading size={ICON_SIZE} />,
  h1: <Heading1 size={ICON_SIZE} />,
  h2: <Heading2 size={ICON_SIZE} />,
  h3: <Heading3 size={ICON_SIZE} />,
  h4: <Heading4 size={ICON_SIZE} />,
  h5: <Heading5 size={ICON_SIZE} />,
  quote: <Quote size={ICON_SIZE} />,
  code: <Code size={ICON_SIZE} />,
  codeblock: <FileCode size={ICON_SIZE} />,
  link: <Link size={ICON_SIZE} />,
  image: <Image size={ICON_SIZE} />,
  table: <Table size={ICON_SIZE} />,
  ul: <List size={ICON_SIZE} />,
  ol: <ListOrdered size={ICON_SIZE} />,
  task: <ListChecks size={ICON_SIZE} />,
  hr: <Minus size={ICON_SIZE} />,
  math: <Sigma size={ICON_SIZE} />,
  undo: <Undo2 size={ICON_SIZE} />,
  redo: <Redo2 size={ICON_SIZE} />,
  preview: <Eye size={ICON_SIZE} />,
  fullscreen: <Maximize size={ICON_SIZE} />,
  layout: <LayoutDashboard size={ICON_SIZE} />,
  'layout-editor-only': <SquarePen size={ICON_SIZE} />,
  'layout-split': <Columns2 size={ICON_SIZE} />,
  'layout-tabs': <LayoutDashboard size={ICON_SIZE} />,
  'layout-preview-only': <Eye size={ICON_SIZE} />,
};

export const ToolbarIcon: React.FC<{ name: string }> = ({ name }) => {
  const icon = lucideIcons[name];
  if (icon) {
    return <span className="toolbar-icon toolbar-icon-svg">{icon}</span>;
  }
  return <span className="toolbar-icon">{name}</span>;
};

export default ToolbarIcon;
