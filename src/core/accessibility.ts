import { visit } from 'unist-util-visit';
import type { Root } from 'hast';
import type { Plugin } from 'unified';

/**
 * rehype 插件：增强 HTML 的无障碍属性
 */
export const rehypeA11y: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node: any) => {
      // 1. 图片必须有 alt
      if (node.tagName === 'img' && !node.properties?.alt) {
        node.properties = node.properties ?? {};
        node.properties.alt = 'Image';
      }

      // 2. 表格添加 role
      if (node.tagName === 'table') {
        node.properties = node.properties ?? {};
        node.properties.role = 'table';
      }

      // 3. 代码块添加 aria-label
      if (node.tagName === 'pre' && node.properties?.['data-language']) {
        node.properties['aria-label'] = `Code block in ${node.properties['data-language']}`;
        node.properties.role = 'region';
      }

      // 4. 任务列表 checkbox 添加 aria-label
      if (node.tagName === 'input' && node.properties?.type === 'checkbox') {
        node.properties['aria-label'] = node.properties.checked
          ? 'Completed task'
          : 'Incomplete task';
      }

      // 5. 数学公式添加 role
      if (node.properties?.className?.includes?.('math')) {
        node.properties.role = 'math';
      }
    });
  };
};

export default rehypeA11y;
