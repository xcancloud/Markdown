// ============================================================
// Image Upload Helpers
// ============================================================
// Framework-agnostic utilities used by <MarkdownEditor /> to insert
// placeholders while uploading pasted/dropped images and swap them
// for the final Markdown once the external uploader resolves.
//
// Exposed separately so the behavior (unique placeholder, URL
// encoding, failure marker) can be unit-tested without a live
// CodeMirror view.
// ============================================================

export interface ImageUploadMessages {
  /** Text shown in the placeholder `![Uploading... <id>]()` while awaiting upload. */
  uploading: string;
  /** Text used for the HTML comment that replaces the placeholder on failure. */
  uploadFailed: string;
}

export interface ImageUploadLifecycle {
  /** Unique placeholder inserted into the document. */
  readonly placeholder: string;
  /** Build the success replacement Markdown. */
  success(url: string, alt?: string): string;
  /** Build the failure replacement (an HTML comment, safe & removable). */
  failure(message?: string): string;
}

/**
 * Generates a short random id. Prefers `crypto.randomUUID` when available,
 * falls back to `Math.random` (sufficient for uniqueness within a session).
 */
export function generateUploadId(): string {
  const g = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (g && typeof g.randomUUID === 'function') {
    return g.randomUUID().replace(/-/g, '').slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Percent-encode characters that would break Markdown image syntax:
 * `(` → `%28`, `)` → `%29`, whitespace, and backslashes.
 * Does NOT double-encode already-encoded sequences (leaves `%XX` intact).
 * Note: `encodeURIComponent` itself doesn't encode `(` / `)` (they are in
 * the "mark" set per RFC 3986), so they are handled explicitly.
 */
export function encodeMarkdownUrl(url: string): string {
  return url.replace(/[\s()\\]/g, (c) => {
    if (c === '(') return '%28';
    if (c === ')') return '%29';
    return encodeURIComponent(c);
  });
}

/**
 * Strip characters that would break the `![alt](url)` syntax from an alt text.
 */
export function sanitizeAltText(alt: string): string {
  return alt.replace(/[\[\]\r\n]+/g, ' ').trim();
}

/**
 * True if the given File is an image (MIME prefix `image/`).
 */
export function isImageFile(file: File | null | undefined): file is File {
  return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
}

/**
 * Extract all image files from a list (e.g. `DataTransferItemList`'s files).
 */
export function collectImageFiles(
  files: FileList | File[] | null | undefined,
): File[] {
  if (!files) return [];
  const out: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (isImageFile(f)) out.push(f);
  }
  return out;
}

// ============================================================
// Clipboard payload classification
// ============================================================
// Separate "files vs text" concerns so the editor can decide:
//   - pure text paste → let the browser's default insertion run
//   - pure image paste → intercept and upload
//   - mixed paste      → follow the configured strategy
// ============================================================

/**
 * Normalized view of a paste / drop payload. All fields are safe to
 * read regardless of the source (clipboard or drag-and-drop).
 */
export interface ClipboardPayload {
  /** Image files found on the transfer (MIME `image/*`). */
  readonly images: File[];
  /** Non-image files (e.g. .pdf, .zip, .docx). */
  readonly otherFiles: File[];
  /** `text/plain` content, or `''` when absent. */
  readonly text: string;
  /** `text/html` content, or `''` when absent. */
  readonly html: string;
  /** `text/uri-list` content, or `''` when absent. */
  readonly uriList: string;
  /** True when the payload contains at least one `image/*` file. */
  readonly hasImages: boolean;
  /** True when the payload contains any textual content. */
  readonly hasText: boolean;
  /** True when the payload contains non-image files only. */
  readonly hasOnlyNonImageFiles: boolean;
}

type TransferLike =
  | DataTransfer
  | { items?: DataTransferItemList | null; files?: FileList | null; types?: readonly string[] }
  | null
  | undefined;

function readString(transfer: TransferLike, type: string): string {
  if (!transfer) return '';
  const t = transfer as DataTransfer;
  try {
    return t.getData?.(type) ?? '';
  } catch {
    return '';
  }
}

/**
 * Classify a `ClipboardEvent`/`DragEvent` transfer into a `ClipboardPayload`.
 *
 * Image files are resolved both from `items` (where available — covers
 * screenshots that don't surface in `files`) and from `files`, and
 * deduplicated by `(name,size,type,lastModified)` to avoid double-uploads
 * on browsers that populate both collections.
 */
export function classifyClipboard(transfer: TransferLike): ClipboardPayload {
  const images: File[] = [];
  const otherFiles: File[] = [];
  const seen = new Set<string>();
  const key = (f: File) => `${f.name}|${f.size}|${f.type}|${f.lastModified}`;

  const push = (f: File | null | undefined) => {
    if (!f) return;
    const k = key(f);
    if (seen.has(k)) return;
    seen.add(k);
    if (isImageFile(f)) images.push(f);
    else otherFiles.push(f);
  };

  const items = (transfer as DataTransfer | undefined)?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') push(it.getAsFile());
    }
  }
  const files = (transfer as DataTransfer | undefined)?.files;
  if (files) {
    for (let i = 0; i < files.length; i++) push(files[i]);
  }

  const text = readString(transfer, 'text/plain');
  const html = readString(transfer, 'text/html');
  const uriList = readString(transfer, 'text/uri-list');

  const hasImages = images.length > 0;
  const hasText = Boolean(text || html || uriList);
  const hasOnlyNonImageFiles =
    !hasImages && otherFiles.length > 0 && !hasText;

  return { images, otherFiles, text, html, uriList, hasImages, hasText, hasOnlyNonImageFiles };
}

/**
 * Strategy for a paste/drop that contains **both** image files and
 * textual content (common on Windows screenshots that include an
 * `<img src="file:///…">` HTML fragment alongside the bitmap).
 *
 * - `image-first` (default) — upload the image(s); drop the text.
 * - `text-first`            — insert the text; ignore the image bytes.
 * - `image-and-text`        — upload the image AND paste the text after it.
 */
export type MixedPastePolicy = 'image-first' | 'text-first' | 'image-and-text';

/**
 * Create a lifecycle object for a single image upload.
 *
 * - `placeholder` is a unique Markdown image node (`![Uploading… <id>]()`)
 *   that gets inserted immediately so the user sees progress feedback.
 * - `success(url, alt)` returns the final `![alt](encoded-url)` markdown.
 * - `failure(message)` returns an HTML comment so failed uploads don't
 *   pollute the rendered output but remain visible in the source.
 */
export function createImageUploadLifecycle(
  file: File,
  messages?: Partial<ImageUploadMessages>,
): ImageUploadLifecycle {
  const uploading = messages?.uploading ?? 'Uploading...';
  const uploadFailed = messages?.uploadFailed ?? 'Upload failed';
  const id = generateUploadId();
  const placeholder = `![${uploading} ${id}]()`;

  return {
    placeholder,
    success(url, alt) {
      const altText = sanitizeAltText(alt ?? file.name ?? 'image');
      return `![${altText}](${encodeMarkdownUrl(url)})`;
    },
    failure(message) {
      const raw = message ?? '';
      const detail = raw.replace(/-->/g, '--&gt;');
      return `<!-- ${uploadFailed}${detail ? `: ${detail}` : ''} -->`;
    },
  };
}

// ============================================================
// Document-agnostic driver
// ============================================================
// Exposed as a thin interface so we can drive CodeMirror (or any
// document) without pulling CodeMirror types into this module.

export interface ImageUploadDocAdapter {
  /** Current full document text. */
  getText(): string;
  /** Replace `[from, to)` with the given text. */
  replaceRange(from: number, to: number, text: string): void;
  /** Insert text at `pos`. */
  insertAt(pos: number, text: string): void;
}

export interface PerformImageUploadOptions {
  file: File;
  /** Absolute offset where the placeholder should be inserted. */
  insertPos: number;
  /** External uploader; must resolve to a URL string. */
  upload: (file: File) => Promise<string>;
  /** Document adapter (CodeMirror view wrapper in production). */
  doc: ImageUploadDocAdapter;
  /** Optional i18n messages. */
  messages?: Partial<ImageUploadMessages>;
  /** Invoked after the placeholder has been replaced (success or failure). */
  onSettled?: (result: { success: true; url: string } | { success: false; error: unknown }) => void;
}

/**
 * Orchestrates a single image upload: inserts a placeholder, awaits the
 * uploader, and swaps the placeholder for the final Markdown. Returns
 * the uploaded URL on success.
 *
 * Implementation notes:
 * - The placeholder is unique per call, so concurrent uploads do not
 *   collide with each other (fixes multi-paste races).
 * - If the placeholder is no longer present (user deleted it mid-upload),
 *   the swap is silently skipped.
 */
export async function performImageUpload(
  opts: PerformImageUploadOptions,
): Promise<string | null> {
  const { file, insertPos, upload, doc, messages, onSettled } = opts;
  const lc = createImageUploadLifecycle(file, messages);
  doc.insertAt(insertPos, lc.placeholder);

  const swap = (replacement: string) => {
    const text = doc.getText();
    const idx = text.indexOf(lc.placeholder);
    if (idx < 0) return false;
    doc.replaceRange(idx, idx + lc.placeholder.length, replacement);
    return true;
  };

  try {
    const url = await upload(file);
    swap(lc.success(url, file.name));
    onSettled?.({ success: true, url });
    return url;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    swap(lc.failure(msg));
    onSettled?.({ success: false, error });
    return null;
  }
}
