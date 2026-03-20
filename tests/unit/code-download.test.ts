import { describe, it, expect } from 'vitest';
import {
  resolveDownloadFilename,
  parseCodeDownloadMeta,
} from '../../src/core/utils/code-download';

// ============================
// resolveDownloadFilename
// ============================
describe('resolveDownloadFilename', () => {
  it('should use metaFilename with extension when provided', () => {
    const result = resolveDownloadFilename('console.log("hi")', 'typescript', 'App.tsx');
    expect(result).toBe('App.tsx');
  });

  it('should append language extension when metaFilename has no extension', () => {
    const result = resolveDownloadFilename('print("hi")', 'python', 'hello');
    expect(result).toBe('hello.py');
  });

  it('should fall back to parseCodeDownloadMeta when no metaFilename', () => {
    const result = resolveDownloadFilename('console.log("hi")', 'javascript');
    expect(result).toBe('code-snippet.js');
  });

  it('should fall back to parseCodeDownloadMeta when metaFilename is undefined', () => {
    const result = resolveDownloadFilename('console.log("hi")', 'typescript', undefined);
    expect(result).toBe('code-snippet.ts');
  });

  it('should sanitize special characters in metaFilename', () => {
    const result = resolveDownloadFilename('', 'python', 'my*"file<>.py');
    expect(result).toBe('my__file__.py');
  });

  it('should strip path segments from metaFilename', () => {
    const result = resolveDownloadFilename('', 'typescript', 'src/components/App.tsx');
    expect(result).toBe('App.tsx');
  });

  it('should handle metaFilename with spaces', () => {
    const result = resolveDownloadFilename('', 'python', 'my script.py');
    expect(result).toBe('my_script.py');
  });

  it('should use code-content filename when no metaFilename and code has directive', () => {
    const code = '// file: utils.js\nconst x = 1;';
    const result = resolveDownloadFilename(code, 'javascript');
    expect(result).toBe('utils.js');
  });

  it('should handle empty metaFilename by falling back', () => {
    const result = resolveDownloadFilename('const x = 1;', 'javascript', '');
    expect(result).toBe('code-snippet.js');
  });
});

// ============================
// parseCodeDownloadMeta
// ============================
describe('parseCodeDownloadMeta', () => {
  it('should return default for code without filename directive', () => {
    const result = parseCodeDownloadMeta('const x = 1;', 'javascript');
    expect(result).toEqual({ basename: 'code-snippet', ext: 'js' });
  });

  it('should parse // file: directive', () => {
    const code = '// file: utils.js\nconst x = 1;';
    const result = parseCodeDownloadMeta(code, 'javascript');
    expect(result).toEqual({ basename: 'utils', ext: 'js' });
  });

  it('should parse # filename= directive', () => {
    const code = '# filename= hello.py\nprint("hello")';
    const result = parseCodeDownloadMeta(code, 'python');
    expect(result).toEqual({ basename: 'hello', ext: 'py' });
  });

  it('should map language to correct extension', () => {
    expect(parseCodeDownloadMeta('', 'typescript').ext).toBe('ts');
    expect(parseCodeDownloadMeta('', 'python').ext).toBe('py');
    expect(parseCodeDownloadMeta('', 'rust').ext).toBe('rs');
    expect(parseCodeDownloadMeta('', 'unknown').ext).toBe('txt');
  });
});
