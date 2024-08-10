import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";
import { vitePluginTrace } from './src/tracing';
import { transformSync } from '@babel/core';
import { babelPluginRemoveTracing } from './src/tracing';

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
      ? [vitePluginTrace({ effectName: 'MyComponentEffect' })] 
      : [createRemoveTracingPlugin()]),
  ],
}));