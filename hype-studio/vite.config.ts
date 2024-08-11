import { defineConfig, PluginOption} from 'vite'
import path from 'path';
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

export default defineConfig(({ mode }) => ({
  plugins: [
    babel(options) as PluginOption
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