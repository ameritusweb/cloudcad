import { defineConfig, PluginOption, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import { vitePluginTrace } from './src/tracing';
import { transformSync } from '@babel/core';
import { babelPluginRemoveTracing } from './src/tracing';
import viteTracePlugin from './src/tracing/server/viteTracePlugin';
import path, { extname } from 'path';
import babel, { RollupBabelInputPluginOptions } from '@rollup/plugin-babel';

const options: RollupBabelInputPluginOptions = {
  babelHelpers: 'bundled',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: ["@babel/preset-react"],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }]
  ]
};

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
    react({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }]
        ]
      }
    }),
    babel(options) as PluginOption,
    svgr(),
    ...(mode === 'development' 
      ? [vitePluginTrace({ effectName: 'MyComponentEffect' }),
        viteTracePlugin({
          include: ['src/utils', 'src/contexts/HypeStudioContext.jsx'],
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
      '/trace': {
        target: 'http://localhost:3000',
        changeOrigin: true 
      }
    }
  }
}));