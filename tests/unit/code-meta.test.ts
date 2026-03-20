import { describe, it, expect } from 'vitest';
import { parseCodeMeta, extractCodeBlocks } from '../../src/core/utils/code-meta';
import { renderMarkdown } from '../../src/core/processor';

// ============================
// parseCodeMeta
// ============================
describe('parseCodeMeta', () => {
  it('should return empty object for null/undefined/empty input', () => {
    expect(parseCodeMeta(null)).toEqual({});
    expect(parseCodeMeta(undefined)).toEqual({});
    expect(parseCodeMeta('')).toEqual({});
    expect(parseCodeMeta('   ')).toEqual({});
  });

  it('should parse a single key=value pair', () => {
    expect(parseCodeMeta('filename=hello.py')).toEqual({
      filename: 'hello.py',
    });
  });

  it('should parse multiple key=value pairs', () => {
    const result = parseCodeMeta('filename=hello.py dir=src/hello.py');
    expect(result).toEqual({
      filename: 'hello.py',
      dir: 'src/hello.py',
    });
  });

  it('should parse double-quoted values with spaces', () => {
    const result = parseCodeMeta('filename="my file.py" title="Hello World"');
    expect(result).toEqual({
      filename: 'my file.py',
      title: 'Hello World',
    });
  });

  it('should parse single-quoted values', () => {
    const result = parseCodeMeta("filename='hello.py' title='Test'");
    expect(result).toEqual({
      filename: 'hello.py',
      title: 'Test',
    });
  });

  it('should parse brace-enclosed values', () => {
    const result = parseCodeMeta('highlight={1,3-5} filename=test.js');
    expect(result).toEqual({
      highlight: '{1,3-5}',
      filename: 'test.js',
    });
  });

  it('should handle mixed quote styles', () => {
    const result = parseCodeMeta('filename="hello.py" dir=src title=\'test\'');
    expect(result).toEqual({
      filename: 'hello.py',
      dir: 'src',
      title: 'test',
    });
  });

  it('should handle keys with hyphens', () => {
    const result = parseCodeMeta('line-numbers=true show-copy=false');
    expect(result).toEqual({
      'line-numbers': 'true',
      'show-copy': 'false',
    });
  });

  it('should handle empty quoted values', () => {
    const result = parseCodeMeta('filename="" dir=""');
    expect(result).toEqual({
      filename: '',
      dir: '',
    });
  });

  it('should handle values with special characters', () => {
    const result = parseCodeMeta('filename=hello_world.test.py dir=src/utils/v2');
    expect(result).toEqual({
      filename: 'hello_world.test.py',
      dir: 'src/utils/v2',
    });
  });

  it('should handle path-style values', () => {
    const result = parseCodeMeta('dir=src/components/ui');
    expect(result).toEqual({
      dir: 'src/components/ui',
    });
  });
});

// ============================
// extractCodeBlocks
// ============================
describe('extractCodeBlocks', () => {
  it('should extract a simple code block', () => {
    const source = '```python\nprint("Hello")\n```';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('python');
    expect(blocks[0].code).toBe('print("Hello")');
    expect(blocks[0].meta).toBe('');
    expect(blocks[0].attributes).toEqual({});
  });

  it('should extract code block with meta attributes', () => {
    const source = '```python filename=hello.py dir=src/hello.py\nprint("Hello")\n```';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('python');
    expect(blocks[0].meta).toBe('filename=hello.py dir=src/hello.py');
    expect(blocks[0].attributes).toEqual({
      filename: 'hello.py',
      dir: 'src/hello.py',
    });
    expect(blocks[0].code).toBe('print("Hello")');
  });

  it('should extract multiple code blocks', () => {
    const source = [
      '```javascript filename=app.js',
      'console.log("Hello");',
      '```',
      '',
      'Some text in between',
      '',
      '```python dir=scripts',
      'print("World")',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(2);

    expect(blocks[0].language).toBe('javascript');
    expect(blocks[0].attributes.filename).toBe('app.js');
    expect(blocks[0].code).toBe('console.log("Hello");');

    expect(blocks[1].language).toBe('python');
    expect(blocks[1].attributes.dir).toBe('scripts');
    expect(blocks[1].code).toBe('print("World")');
  });

  it('should handle code blocks without language', () => {
    const source = '```\nplain text\n```';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('');
    expect(blocks[0].code).toBe('plain text');
  });

  it('should handle code blocks with tilde fences', () => {
    const source = '~~~python filename=test.py\nprint("test")\n~~~';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('python');
    expect(blocks[0].attributes.filename).toBe('test.py');
  });

  it('should handle code blocks with multi-line content', () => {
    const source = [
      '```typescript filename=greet.ts',
      'function greet(name: string): string {',
      '  return `Hello, ${name}!`;',
      '}',
      '',
      'export default greet;',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('typescript');
    expect(blocks[0].attributes.filename).toBe('greet.ts');
    expect(blocks[0].code).toContain('function greet');
    expect(blocks[0].code).toContain('export default greet;');
  });

  it('should handle empty code blocks', () => {
    const source = '```python filename=empty.py\n```';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe('python');
    expect(blocks[0].code).toBe('');
  });

  it('should return empty array for text without code blocks', () => {
    const source = 'Just some regular text.\n\nNo code blocks here.';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(0);
  });

  it('should handle code block with quoted meta values', () => {
    const source = '```python filename="my script.py" title="Hello World"\nprint("Hi")\n```';
    const blocks = extractCodeBlocks(source);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].attributes.filename).toBe('my script.py');
    expect(blocks[0].attributes.title).toBe('Hello World');
  });
});

// ============================
// Integration: code meta through rendering pipeline
// ============================
describe('Code block meta rendering pipeline', () => {
  it('should render code block with meta attributes as data-* attributes', async () => {
    const md = '```python filename=hello.py dir=src\nprint("Hello")\n```';
    const html = await renderMarkdown(md);
    expect(html).toContain('data-language="python"');
    expect(html).toContain('data-meta="filename=hello.py dir=src"');
    expect(html).toContain('data-filename="hello.py"');
    expect(html).toContain('data-dir="src"');
    expect(html).toContain('code-block');
  });

  it('should render code block without meta normally', async () => {
    const md = '```javascript\nconst x = 1;\n```';
    const html = await renderMarkdown(md);
    expect(html).toContain('data-language="javascript"');
    expect(html).toContain('code-block');
    expect(html).not.toContain('data-meta');
  });

  it('should preserve meta attributes alongside existing functionality', async () => {
    const md = '```js filename=test.js\nconsole.log("test");\n```';
    const html = await renderMarkdown(md);
    expect(html).toContain('code-block');
    expect(html).toContain('data-language="js"');
    expect(html).toContain('data-filename="test.js"');
    expect(html).toContain('console');
  });

  it('should handle multiple code blocks with different meta', async () => {
    const md = [
      '```python filename=a.py',
      'print("a")',
      '```',
      '',
      '```typescript filename=b.ts dir=src',
      'console.log("b");',
      '```',
    ].join('\n');

    const html = await renderMarkdown(md);
    expect(html).toContain('data-filename="a.py"');
    expect(html).toContain('data-filename="b.ts"');
    expect(html).toContain('data-dir="src"');
  });
});
