import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      // Multi-entry + rollupTypes can duplicate shared types; emit per-file .d.ts instead.
      rollupTypes: false,
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        viewer: resolve(__dirname, 'src/viewer.ts'),
        renderer: resolve(__dirname, 'src/renderer.ts'),
        editor: resolve(__dirname, 'src/editor.ts'),
      },
      name: 'MarkdownComponent',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'mermaid',
        'katex',
        /^shiki(\/|$)/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: false,
  },
  worker: {
    format: 'es',
  },
});
