import { describe, it, expect, vi } from 'vitest';
import {
  classifyClipboard,
  collectImageFiles,
  createImageUploadLifecycle,
  encodeMarkdownUrl,
  generateUploadId,
  isImageFile,
  performImageUpload,
  sanitizeAltText,
  type ImageUploadDocAdapter,
} from '../../src/utils/image-upload';

// ---------------------------------------------------------
// Minimal in-memory document adapter for testing
// ---------------------------------------------------------
function makeDoc(initial = ''): ImageUploadDocAdapter & { text: string } {
  let text = initial;
  return {
    get text() {
      return text;
    },
    set text(v: string) {
      text = v;
    },
    getText: () => text,
    replaceRange: (from, to, insert) => {
      text = text.slice(0, from) + insert + text.slice(to);
    },
    insertAt: (pos, insert) => {
      text = text.slice(0, pos) + insert + text.slice(pos);
    },
  };
}

describe('image-upload helpers', () => {
  describe('encodeMarkdownUrl', () => {
    it('encodes parentheses and whitespace', () => {
      expect(encodeMarkdownUrl('https://x.com/a (b).png')).toBe(
        'https://x.com/a%20%28b%29.png',
      );
    });

    it('leaves already-encoded sequences intact', () => {
      expect(encodeMarkdownUrl('https://x.com/a%20b.png')).toBe(
        'https://x.com/a%20b.png',
      );
    });

    it('encodes backslashes', () => {
      expect(encodeMarkdownUrl('a\\b')).toBe('a%5Cb');
    });
  });

  describe('sanitizeAltText', () => {
    it('collapses square brackets and newlines into single spaces', () => {
      expect(sanitizeAltText('[bad]\nalt')).toBe('bad alt');
    });

    it('returns empty when input is empty', () => {
      expect(sanitizeAltText('')).toBe('');
    });
  });

  describe('isImageFile / collectImageFiles', () => {
    it('detects image MIME prefix', () => {
      const img = new File([''], 'a.png', { type: 'image/png' });
      const txt = new File([''], 'a.txt', { type: 'text/plain' });
      expect(isImageFile(img)).toBe(true);
      expect(isImageFile(txt)).toBe(false);
      expect(isImageFile(null)).toBe(false);
      expect(isImageFile(undefined)).toBe(false);
    });

    it('filters non-image files from FileList-like inputs', () => {
      const img = new File([''], 'a.png', { type: 'image/png' });
      const txt = new File([''], 'a.txt', { type: 'text/plain' });
      expect(collectImageFiles([img, txt])).toEqual([img]);
      expect(collectImageFiles(null)).toEqual([]);
    });
  });

  describe('generateUploadId', () => {
    it('produces distinct short ids', () => {
      const ids = new Set(Array.from({ length: 20 }, () => generateUploadId()));
      expect(ids.size).toBe(20);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9]{8}$/i);
      }
    });
  });

  describe('createImageUploadLifecycle', () => {
    it('builds a unique placeholder and success/failure replacements', () => {
      const file = new File([''], 'pic.png', { type: 'image/png' });
      const lc = createImageUploadLifecycle(file, {
        uploading: '上传中',
        uploadFailed: '上传失败',
      });

      expect(lc.placeholder.startsWith('![上传中 ')).toBe(true);
      expect(lc.placeholder.endsWith(']()')).toBe(true);

      expect(lc.success('https://cdn.x/a b.png')).toBe(
        '![pic.png](https://cdn.x/a%20b.png)',
      );
      expect(lc.success('https://cdn.x/a.png', 'Diagram')).toBe(
        '![Diagram](https://cdn.x/a.png)',
      );

      expect(lc.failure('network error')).toBe(
        '<!-- 上传失败: network error -->',
      );
      expect(lc.failure()).toBe('<!-- 上传失败 -->');
    });

    it('produces different placeholders for consecutive calls', () => {
      const f = new File([''], 'x.png', { type: 'image/png' });
      const a = createImageUploadLifecycle(f).placeholder;
      const b = createImageUploadLifecycle(f).placeholder;
      expect(a).not.toBe(b);
    });
  });

  describe('performImageUpload', () => {
    it('inserts a placeholder then replaces it on success', async () => {
      const doc = makeDoc('hello ');
      const file = new File([''], 'p.png', { type: 'image/png' });
      const onSettled = vi.fn();

      const url = await performImageUpload({
        file,
        insertPos: 6,
        doc,
        upload: async () => 'https://cdn.x/p.png',
        onSettled,
      });

      expect(url).toBe('https://cdn.x/p.png');
      expect(doc.text).toBe('hello ![p.png](https://cdn.x/p.png)');
      expect(onSettled).toHaveBeenCalledWith({
        success: true,
        url: 'https://cdn.x/p.png',
      });
    });

    it('replaces placeholder with failure comment on error', async () => {
      const doc = makeDoc('');
      const file = new File([''], 'bad.png', { type: 'image/png' });
      const onSettled = vi.fn();

      const url = await performImageUpload({
        file,
        insertPos: 0,
        doc,
        upload: async () => {
          throw new Error('boom');
        },
        messages: { uploading: 'Uploading', uploadFailed: 'Failed' },
        onSettled,
      });

      expect(url).toBeNull();
      expect(doc.text).toBe('<!-- Failed: boom -->');
      expect(onSettled).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
      });
    });

    it('handles concurrent uploads without collisions', async () => {
      const doc = makeDoc('');
      const file = new File([''], 'p.png', { type: 'image/png' });

      const [a, b] = await Promise.all([
        performImageUpload({
          file,
          insertPos: 0,
          doc,
          upload: async () => 'https://cdn.x/a.png',
        }),
        performImageUpload({
          file,
          insertPos: doc.getText().length, // after A's placeholder
          doc,
          upload: async () => 'https://cdn.x/b.png',
        }),
      ]);

      expect(a).toBe('https://cdn.x/a.png');
      expect(b).toBe('https://cdn.x/b.png');
      expect(doc.text).toContain('https://cdn.x/a.png');
      expect(doc.text).toContain('https://cdn.x/b.png');
      // No leftover uploading placeholders.
      expect(doc.text).not.toMatch(/Uploading\.\.\./);
    });

    it('silently skips replacement when the placeholder was removed', async () => {
      const doc = makeDoc('');
      const file = new File([''], 'p.png', { type: 'image/png' });

      // Delete the placeholder before the upload resolves.
      const promise = performImageUpload({
        file,
        insertPos: 0,
        doc,
        upload: () =>
          new Promise((resolve) => setTimeout(() => resolve('https://cdn.x/p.png'), 10)),
      });
      doc.text = 'user wrote something';
      const url = await promise;

      expect(url).toBe('https://cdn.x/p.png');
      expect(doc.text).toBe('user wrote something');
    });

    it('encodes URL special characters in the success replacement', async () => {
      const doc = makeDoc('');
      const file = new File([''], 'spec.png', { type: 'image/png' });
      await performImageUpload({
        file,
        insertPos: 0,
        doc,
        upload: async () => 'https://cdn.x/foo (v2).png',
      });
      expect(doc.text).toBe('![spec.png](https://cdn.x/foo%20%28v2%29.png)');
    });
  });
});

// ---------------------------------------------------------
// Minimal DataTransfer stub for classifyClipboard tests
// ---------------------------------------------------------
function makeTransfer(opts: {
  files?: File[];
  strings?: Record<string, string>;
}): DataTransfer {
  const files = opts.files ?? [];
  const strings = opts.strings ?? {};
  const items = files.map((f) => ({
    kind: 'file' as const,
    type: f.type,
    getAsFile: () => f,
  }));
  return {
    items: items as unknown as DataTransferItemList,
    files: Object.assign(files, {
      length: files.length,
      item: (i: number) => files[i] ?? null,
    }) as unknown as FileList,
    types: Object.keys(strings),
    getData: (type: string) => strings[type] ?? '',
  } as unknown as DataTransfer;
}

describe('classifyClipboard', () => {
  it('returns empty payload for null/undefined transfer', () => {
    const p = classifyClipboard(null);
    expect(p.hasImages).toBe(false);
    expect(p.hasText).toBe(false);
    expect(p.images).toEqual([]);
    expect(p.text).toBe('');
  });

  it('classifies a pure text paste', () => {
    const p = classifyClipboard(
      makeTransfer({ strings: { 'text/plain': 'hello world' } }),
    );
    expect(p.hasText).toBe(true);
    expect(p.hasImages).toBe(false);
    expect(p.text).toBe('hello world');
    expect(p.html).toBe('');
  });

  it('classifies a pure image paste (screenshot)', () => {
    const img = new File([''], 'clip.png', { type: 'image/png' });
    const p = classifyClipboard(makeTransfer({ files: [img] }));
    expect(p.hasImages).toBe(true);
    expect(p.hasText).toBe(false);
    expect(p.images).toEqual([img]);
    expect(p.otherFiles).toEqual([]);
  });

  it('classifies a mixed image+text paste (Windows screenshot)', () => {
    const img = new File([''], 'clip.png', { type: 'image/png' });
    const p = classifyClipboard(
      makeTransfer({
        files: [img],
        strings: {
          'text/plain': '',
          'text/html': '<img src="file:///C:/clip.png">',
        },
      }),
    );
    expect(p.hasImages).toBe(true);
    expect(p.hasText).toBe(true);
    expect(p.html).toContain('<img');
  });

  it('separates non-image files', () => {
    const pdf = new File([''], 'a.pdf', { type: 'application/pdf' });
    const img = new File([''], 'b.png', { type: 'image/png' });
    const p = classifyClipboard(makeTransfer({ files: [pdf, img] }));
    expect(p.images).toEqual([img]);
    expect(p.otherFiles).toEqual([pdf]);
    expect(p.hasOnlyNonImageFiles).toBe(false);
  });

  it('detects non-image-only payload', () => {
    const pdf = new File([''], 'a.pdf', { type: 'application/pdf' });
    const p = classifyClipboard(makeTransfer({ files: [pdf] }));
    expect(p.hasOnlyNonImageFiles).toBe(true);
  });

  it('deduplicates files that appear in both items and files', () => {
    const img = new File(['x'], 'clip.png', {
      type: 'image/png',
      lastModified: 1,
    });
    // Simulate Safari: same file exposed via both items and files lists.
    const items = [{ kind: 'file' as const, type: img.type, getAsFile: () => img }];
    const filesArr: File[] = [img];
    const transfer = {
      items: items as unknown as DataTransferItemList,
      files: Object.assign(filesArr, {
        length: 1,
        item: () => img,
      }) as unknown as FileList,
      types: [],
      getData: () => '',
    } as unknown as DataTransfer;
    const p = classifyClipboard(transfer);
    expect(p.images).toHaveLength(1);
  });

  it('reads text/uri-list for drag-and-drop URL drops', () => {
    const p = classifyClipboard(
      makeTransfer({ strings: { 'text/uri-list': 'https://x.com/a' } }),
    );
    expect(p.uriList).toBe('https://x.com/a');
    expect(p.hasText).toBe(true);
  });
});
