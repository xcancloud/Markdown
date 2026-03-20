/**
 * Parse code fence meta strings into key-value pairs.
 *
 * Standard syntax:    ```python
 * Extended syntax:    ```python filename=hello.py dir=src/hello.py
 *
 * The meta string is the portion after the language identifier in a fenced
 * code block opening.  Values may optionally be quoted with `"` or `'`.
 *
 * @example
 * parseCodeMeta('filename=hello.py dir=src/hello.py')
 * // => { filename: 'hello.py', dir: 'src/hello.py' }
 *
 * parseCodeMeta('filename="my file.py" highlight={1,3}')
 * // => { filename: 'my file.py', highlight: '{1,3}' }
 */
export function parseCodeMeta(meta: string | null | undefined): Record<string, string> {
  if (!meta || !meta.trim()) return {};

  const result: Record<string, string> = {};

  // Match key=value pairs where value can be:
  //  - double-quoted string
  //  - single-quoted string
  //  - brace-enclosed string {…}
  //  - unquoted non-whitespace string
  const regex = /(\w[\w-]*)=(?:"([^"]*?)"|'([^']*?)'|(\{[^}]*\})|(\S+))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(meta)) !== null) {
    const key = match[1];
    // Pick whichever capture group matched
    const value = match[2] ?? match[3] ?? match[4] ?? match[5] ?? '';
    result[key] = value;
  }

  return result;
}

/**
 * Represents a parsed code block with its content, language, and any
 * extended meta attributes from the fence line.
 */
export interface CodeBlockMeta {
  /** Programming language identifier (e.g. 'python', 'typescript') */
  language: string;
  /** Raw meta string after the language identifier */
  meta: string;
  /** Parsed key-value attributes from the meta string */
  attributes: Record<string, string>;
  /** The code content of the block */
  code: string;
}

/**
 * Extract all code blocks from a Markdown source string, including their
 * language, raw meta, parsed attributes, and code content.
 *
 * @example
 * const blocks = extractCodeBlocks('```python filename=hello.py\nprint("Hi")\n```');
 * // => [{ language: 'python', meta: 'filename=hello.py', attributes: { filename: 'hello.py' }, code: 'print("Hi")' }]
 */
export function extractCodeBlocks(source: string): CodeBlockMeta[] {
  const blocks: CodeBlockMeta[] = [];
  const lines = source.split('\n');
  let i = 0;

  while (i < lines.length) {
    // Match opening fence: ``` or ~~~ with optional language + meta
    const openMatch = lines[i].match(/^(`{3,}|~{3,})\s*(\S+)?[ \t]*(.*?)[ \t]*$/);
    if (!openMatch) {
      i++;
      continue;
    }

    const fence = openMatch[1];
    const fenceChar = fence[0];
    const fenceLen = fence.length;
    const language = openMatch[2] ?? '';
    const meta = openMatch[3] ?? '';

    // Collect content lines until matching closing fence
    const contentLines: string[] = [];
    i++;
    let closed = false;

    while (i < lines.length) {
      // Closing fence must use same character and be at least as long
      const closePattern = new RegExp(`^${fenceChar}{${fenceLen},}\\s*$`);
      if (closePattern.test(lines[i])) {
        closed = true;
        i++;
        break;
      }
      contentLines.push(lines[i]);
      i++;
    }

    if (closed) {
      blocks.push({
        language,
        meta,
        attributes: parseCodeMeta(meta),
        code: contentLines.join('\n'),
      });
    }
  }

  return blocks;
}
