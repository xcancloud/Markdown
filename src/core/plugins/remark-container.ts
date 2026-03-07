import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';

/**
 * remark 插件：处理自定义容器指令
 * :::warning
 * content
 * :::
 *
 * 基于 remark-directive 解析的 containerDirective 节点
 */
export const remarkContainer: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const name = node.name as string;

        // 为容器添加 hProperties
        const data = node.data ?? (node.data = {});
        const hProperties = data.hProperties ?? (data.hProperties = {});

        // 根据指令类型设置 class
        if (
          ['note', 'tip', 'warning', 'caution', 'important', 'danger'].includes(
            name,
          )
        ) {
          hProperties.className = [
            'markdown-container',
            `markdown-container-${name}`,
          ];
          data.hName = 'div';
        } else {
          // 通用容器
          hProperties.className = [
            'markdown-container',
            `markdown-container-${name}`,
          ];
          data.hName = node.type === 'textDirective' ? 'span' : 'div';
        }
      }
    });
  };
};

export default remarkContainer;
