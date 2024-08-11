import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";
import { vitePluginTrace } from './src/tracing';
import { transformSync } from '@babel/core';
import { babelPluginRemoveTracing } from './src/tracing';
import viteTracePlugin from './src/tracing/server/viteTracePlugin';
import path from 'path';

function createRemoveTracingPlugin(): Plugin {
  return {
    name: 'remove-tracing',
    transform(code, id) {
      if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx')) {
        const result = transformSync(code, {
          plugins: [babelPluginRemoveTracing],
          filename: id,
        });
        return result?.code || code;
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    ...(mode === 'development' 
      ? [vitePluginTrace({ effectName: 'MyComponentEffect' }),
        viteTracePlugin({
          include: ['src/utils'],
          exclude: ['node_modules', 'test']
        })
      ] 
      : [createRemoveTracingPlugin()]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  server: {
    proxy: {
      '/trace': 'http://localhost:3000'
    }
  }
}));