import { visit } from 'unist-util-visit';
import { parseCodeMeta } from '../utils/code-meta';
import type { Root, Code } from 'mdast';
import type { Plugin } from 'unified';

/**
 * Remark plugin that parses extended attributes from fenced code block
 * meta strings and stores them in `node.data.hProperties` so that
 * remark-rehype carries them over to the resulting `<code>` element as
 * `data-*` HTML attributes.
 *
 * Standard syntax:
 *   ```python
 *   print("Hello")
 *   ```
 *
 * Extended syntax (meta attributes):
 *   ```python filename=hello.py dir=src/hello.py
 *   print("Hello")
 *   ```
 *
 * The plugin adds `data-meta`, `data-filename`, `data-dir`, etc. to the
 * HTML output.
 */
const remarkCodeMeta: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      const meta = node.meta;
      if (!meta) return;

      const attrs = parseCodeMeta(meta);
      if (Object.keys(attrs).length === 0) return;

      // Build data-* properties for the <code> element
      const hProperties: Record<string, string> = {
        'data-meta': meta,
      };

      for (const [key, value] of Object.entries(attrs)) {
        hProperties[`data-${key}`] = value;
      }

      // remark-rehype reads node.data.hProperties and forwards them to
      // the generated HAST element.
      if (!node.data) node.data = {};
      node.data.hProperties = {
        ...(node.data.hProperties as Record<string, string> | undefined),
        ...hProperties,
      };
    });
  };
};

export { remarkCodeMeta };
export default remarkCodeMeta;
