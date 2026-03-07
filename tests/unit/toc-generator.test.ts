import { describe, it, expect } from 'vitest';
import { extractToc } from '../../src/core/plugins/toc-generator';
import { parseToAst } from '../../src/core/processor';

describe('TOC Generator', () => {
  it('should extract headings from markdown AST', () => {
    const md = '# Title\n## Section 1\n### Sub 1.1\n## Section 2';
    const ast = parseToAst(md);
    const toc = extractToc(ast);

    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Title');
    expect(toc[0].depth).toBe(1);
    expect(toc[0].children).toHaveLength(2);
    expect(toc[0].children[0].text).toBe('Section 1');
    expect(toc[0].children[0].children).toHaveLength(1);
    expect(toc[0].children[0].children[0].text).toBe('Sub 1.1');
    expect(toc[0].children[1].text).toBe('Section 2');
  });

  it('should generate slugs for headings', () => {
    const md = '# Hello World\n## Another Heading';
    const ast = parseToAst(md);
    const toc = extractToc(ast);

    expect(toc[0].id).toBe('hello-world');
    expect(toc[0].children[0].id).toBe('another-heading');
  });

  it('should handle empty document', () => {
    const ast = parseToAst('');
    const toc = extractToc(ast);

    expect(toc).toHaveLength(0);
  });

  it('should handle flat headings (same level)', () => {
    const md = '## A\n## B\n## C';
    const ast = parseToAst(md);
    const toc = extractToc(ast);

    expect(toc).toHaveLength(3);
    expect(toc[0].text).toBe('A');
    expect(toc[1].text).toBe('B');
    expect(toc[2].text).toBe('C');
  });

  it('should handle level jumps', () => {
    const md = '# H1\n### H3\n## H2';
    const ast = parseToAst(md);
    const toc = extractToc(ast);

    expect(toc).toHaveLength(1);
    expect(toc[0].children).toHaveLength(2);
  });
});
