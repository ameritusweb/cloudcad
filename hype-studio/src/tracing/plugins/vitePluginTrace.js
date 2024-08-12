import { transformSync } from '@babel/core';

export default function vitePluginTrace(options = {}) {
  return {
    name: 'vite-plugin-trace',
    transform(code, id) {
      if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx')) {
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
          state.createTraceCallbackImported = false;
        },
        exit(path, state) {
          if (state.traceEffectUsed && !state.traceEffectImported) {
            const importDeclaration = template.statement`import { traceEffect } from '@/tracing/decorators/traceEffect';`();
            path.unshiftContainer('body', importDeclaration);
          }
          if (state.createTraceCallbackUsed && !state.createTraceCallbackImported) {
            const importDeclaration = template.statement`import { createTraceCallback } from '@/tracing/decorators/traceCallback';`();
            path.unshiftContainer('body', importDeclaration);
          }
        },
      },
      CallExpression(path, state) {
        if (path.node.callee.name === 'useEffect') {
          state.traceEffectUsed = true;
          const [effectCallback, dependencies] = path.node.arguments;
          path.node.arguments[0] = createEffectDecorator(t, effectCallback, dependencies, state.opts);
        }
      },
      // Add more visitors here if you need to transform other parts of the code
    },
  };
}

function createEffectDecorator(t, effectCallback, dependencies, opts) {
  const wrappedCallback = t.isFunction(effectCallback) 
    ? effectCallback 
    : t.arrowFunctionExpression([], effectCallback);

  return t.callExpression(
    t.identifier('traceEffect'),
    [
      wrappedCallback,
      dependencies || t.arrayExpression([]),
      t.stringLiteral(opts.effectName || 'useEffect')
    ]
  );
}