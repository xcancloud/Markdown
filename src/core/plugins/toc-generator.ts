import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Heading } from 'mdast';
import type { Plugin } from 'unified';
import GithubSlugger from 'github-slugger';

export interface TocItem {
  depth: number;
  text: string;
  id: string;
  children: TocItem[];
}

/**
 * 从 mdast 中提取 TOC 结构
 */
export function extractToc(tree: Root): TocItem[] {
  const slugger = new GithubSlugger();
  const headings: { depth: number; text: string; id: string }[] = [];

  visit(tree, 'heading', (node: Heading) => {
    const text = toString(node);
    const id = slugger.slug(text);
    headings.push({ depth: node.depth, text, id });
  });

  return buildTocTree(headings);
}

/**
 * 将扁平的 heading 列表构建为嵌套树
 */
function buildTocTree(
  headings: { depth: number; text: string; id: string }[],
): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
}

/**
 * remark 插件：在处理管道中提取 TOC 并存入 vfile.data.toc，
 * 避免渲染后二次解析 AST。
 */
export const remarkExtractToc: Plugin<[], Root> = () => {
  return (tree: Root, file: any) => {
    file.data.toc = extractToc(tree);
  };
};

/**
 * remark 插件：将 [[toc]] 替换为目录
 */
export const remarkToc: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const toc = extractToc(tree);

    visit(tree, 'paragraph', (node) => {
      const text = toString(node).trim().toLowerCase();
      if (text === '[[toc]]' || text === '[toc]') {
        const tocHtml = renderTocHtml(toc);
        (node as any).type = 'html';
        (node as any).value = tocHtml;
        delete (node as any).children;
      }
    });
  };
};

function renderTocHtml(items: TocItem[], depth = 0): string {
  if (items.length === 0) return '';

  const indent = '  '.repeat(depth);
  let html = `${indent}<ul class="markdown-toc markdown-toc-level-${depth}">\n`;

  for (const item of items) {
    html += `${indent}  <li>\n`;
    html += `${indent}    <a href="#${encodeURIComponent(item.id)}" class="markdown-toc-link">${escapeHtml(item.text)}</a>\n`;
    if (item.children.length > 0) {
      html += renderTocHtml(item.children, depth + 1);
    }
    html += `${indent}  </li>\n`;
  }

  html += `${indent}</ul>\n`;
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
