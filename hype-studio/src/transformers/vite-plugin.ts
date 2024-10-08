// vite-transformer-plugin.ts
import type { Plugin } from 'vite';
import ts from 'typescript';
import traceTransformer from './decorator';

export default function customTransformerPlugin(): Plugin {
  return {
    name: 'vite-plugin-custom-transformer',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(js|jsx|ts|tsx)$/.test(id)) return;

      const { outputText, sourceMapText } = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
        },
        transformers: {
          before: [traceTransformer]
        }
      });

      return {
        code: outputText,
        map: sourceMapText ? JSON.parse(sourceMapText) : null
      };
    }
  };
}