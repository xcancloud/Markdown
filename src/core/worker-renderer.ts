// Web Worker 渲染器
// 将耗时的 markdown → html 处理放到 Worker 中，避免阻塞主线程

import { renderMarkdown, type ProcessorOptions } from './processor';

self.onmessage = async (event: MessageEvent) => {
  const { id, source, options } = event.data as {
    id: number;
    source: string;
    options?: ProcessorOptions;
  };

  try {
    const html = await renderMarkdown(source, options);
    self.postMessage({ id, html });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Worker render error',
    });
  }
};
