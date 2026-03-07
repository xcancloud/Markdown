import GithubSlugger from 'github-slugger';

const slugger = new GithubSlugger();

/**
 * 生成 URL 安全的 slug
 */
export function slug(text: string): string {
  return slugger.slug(text);
}

/**
 * 重置 slugger 状态（重新开始计数）
 */
export function resetSlugger(): void {
  slugger.reset();
}
