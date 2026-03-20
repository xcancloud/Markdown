import type { MermaidConfig } from 'mermaid';

let mermaidModule: typeof import('mermaid') | null = null;
let mermaidInitialized = false;

// 懒加载 Mermaid（体积大，按需加载）
async function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidModule) {
    mermaidModule = await import('mermaid');
  }
  return mermaidModule;
}

export interface MermaidRendererOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  config?: Partial<MermaidConfig>;
}

export async function initMermaid(options: MermaidRendererOptions = {}) {
  const mermaid = await loadMermaid();

  if (!mermaidInitialized) {
    mermaid.default.initialize({
      startOnLoad: false,
      theme: options.theme ?? 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-monospace, monospace',
      ...options.config,
    });
    mermaidInitialized = true;
  }

  return mermaid.default;
}

/**
 * 渲染单个 Mermaid 图表
 * @returns SVG 字符串
 */
export async function renderMermaidDiagram(
  code: string,
  id: string,
): Promise<string> {
  const mermaid = await initMermaid();

  try {
    // 先验证语法
    const isValid = await mermaid.parse(code);
    if (!isValid) {
      return createErrorBlock('Mermaid syntax error');
    }

    const { svg } = await mermaid.render(id, code);
    return svg;
  } catch (error) {
    let msg = error instanceof Error ? error.message : 'Mermaid render error';
    // 移除 mermaid 版本号等冗余信息（如 "mermaid version 11.13.0"）
    msg = msg
      .split('\n')
      .filter((line) => !/mermaid\s+version\s+/i.test(line.trim()))
      .join('\n')
      .trim() || 'Mermaid render error';
    return createErrorBlock(msg);
  }
}

function createErrorBlock(message: string): string {
  return `<div class="mermaid-error">
    <span class="mermaid-error-icon">⚠️</span>
    <span class="mermaid-error-message">${escapeHtml(message)}</span>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
