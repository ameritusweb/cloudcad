import { transformSync } from '@babel/core';

export default function vitePluginTrace(options = {}) {
  const { include = [], exclude = [] } = options;

  return {
    name: 'vite-plugin-trace',
    transform(code, id) {
      if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx')) {

        if (!include.some(pattern => id.includes(pattern)) || exclude.some(pattern => id.includes(pattern))) {
          return null;
        }

        return applyTracingDecorators(code, options, id);
      }
      return null;
    },
  };
}

function applyTracingDecorators(code, options, filename) {
  const result = transformSync(code, {
    plugins: [[babelPluginTraceDecorators, options]],
    filename,
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
  });

  return result ? result.code : code;
}

function babelPluginTraceDecorators({ types: t, template }) {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.traceEffectImported = false;
          state.traceCallbackImported = false;
          state.traceUseCallbackImported = false;
        },
        exit(path, state) {
          if (state.traceEffectUsed && !state.traceEffectImported) {
            const importDeclaration = template.statement`import { traceEffect } from '@/tracing/decorators/traceEffect';`();
            path.unshiftContainer('body', importDeclaration);
          }
          if (state.traceCallbackUsed && !state.traceCallbackImported) {
            const importDeclaration = template.statement`import { traceCallback } from '@/tracing/decorators/traceCallback';`();
            path.unshiftContainer('body', importDeclaration);
          }
          if (state.traceUseCallbackUsed && !state.traceUseCallbackImported) {
            const importDeclaration = template.statement`import { traceUseCallback } from '@/tracing/decorators/traceUseCallback';`();
            path.unshiftContainer('body', importDeclaration);
          }
        },
      },
      CallExpression(path, state) {
        if (path.node.callee.name === 'useEffect') {
          state.traceEffectUsed = true;
          const [effectCallback, dependencies] = path.node.arguments;
          path.node.arguments[0] = createEffectDecorator(t, effectCallback, dependencies, state.opts);
        } else if (path.node.callee.name === 'useCallback') {
          state.traceUseCallbackUsed = true;
          const [callback, dependencies] = path.node.arguments;
          path.node.arguments[0] = createUseCallbackDecorator(t, callback, dependencies, state.opts);
        }
        
        state.traceCallbackUsed = true;
      },
    },
  };
}

function createEffectDecorator(t, effectCallback, dependencies, opts) {
  return t.arrowFunctionExpression([], t.callExpression(
    t.identifier('traceEffect'),
    [
      t.isFunction(effectCallback) 
        ? effectCallback 
        : t.arrowFunctionExpression([], effectCallback),
      dependencies || t.arrayExpression([]),
      t.stringLiteral(opts.effectName || 'useEffect')
    ]
  ));
}

function createUseCallbackDecorator(t, callback, dependencies, opts) {
  return t.arrowFunctionExpression(
    [t.restElement(t.identifier('args'))], // Capture all parameters
    t.callExpression(
      t.identifier('traceUseCallback'),
      [
        // The original callback
        t.isFunction(callback) 
          ? callback 
          : t.arrowFunctionExpression([], callback),
        // Dependencies array
        dependencies || t.arrayExpression([]),
        // Callback name
        t.stringLiteral(opts.callbackName || 'useCallback'),
        // Pass the arguments
        t.identifier('args')
      ]
    )
  );
}