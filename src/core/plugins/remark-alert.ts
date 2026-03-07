import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';

/**
 * remark 插件：处理 GFM Alert/提示块
 * 将 > [!NOTE] > [!TIP] > [!WARNING] > [!CAUTION] > [!IMPORTANT]
 * 转换为带有 class 的 HTML 块
 */
export const remarkAlert: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: any) => {
      if (!node.children?.length) return;

      const firstChild = node.children[0];
      if (firstChild.type !== 'paragraph' || !firstChild.children?.length)
        return;

      const firstInline = firstChild.children[0];
      if (firstInline.type !== 'text') return;

      const match = firstInline.value.match(
        /^\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*/i,
      );
      if (!match) return;

      const alertType = match[1].toLowerCase();

      // Remove the alert marker from text
      firstInline.value = firstInline.value.slice(match[0].length);
      if (!firstInline.value && firstChild.children.length === 1) {
        node.children.shift();
      }

      // Add data attributes for the alert type
      node.data = node.data ?? {};
      node.data.hProperties = node.data.hProperties ?? {};
      node.data.hProperties.className = [
        'markdown-alert',
        `markdown-alert-${alertType}`,
      ];
    });
  };
};

export default remarkAlert;
