import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// GitHub Pages 项目页为 https://<owner>.github.io/<repo>/，CI 中设置 VITE_BASE_PATH（须以 / 结尾）
const rawBase = process.env.VITE_BASE_PATH;
const base =
  !rawBase || rawBase === '/'
    ? '/'
    : rawBase.endsWith('/')
      ? rawBase
      : `${rawBase}/`;

export default defineConfig({
  base,
  plugins: [react()],
  // Worker 内联 processor 会触发多 chunk；iife 不支持代码分割（与根库 vite.config 一致）
  worker: {
    format: 'es',
  },
  server: {
    host: '0.0.0.0',
  },
  preview: {
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@xcan-cloud/markdown': resolve(__dirname, '../src/index.ts'),
    },
  },
});
