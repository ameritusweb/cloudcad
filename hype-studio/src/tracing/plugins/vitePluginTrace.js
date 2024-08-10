import { transformSync } from '@babel/core';

export default function vitePluginTrace(options = {}) {
  return {
    name: 'vite-plugin-trace',
    transform(code, id) {
      if (id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx')) {
        return applyTracingDecorators(code, options);
      }
      return null;
    },
  };
}

function applyTracingDecorators(code, options) {
  const result = transformSync(code, {
    plugins: [[babelPluginTraceDecorators, options]],
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
  });

  return result ? result.code : code;
}

function babelPluginTraceDecorators({ types: t }) {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.callee.name === 'useEffect') {
          const [effectCallback, dependencies] = path.node.arguments;
          path.node.arguments[0] = createEffectDecorator(t, effectCallback, dependencies, state.opts);
        }
      },
    },
  };
}

function createEffectDecorator(t, effectCallback, dependencies, opts) {
  // Ensure effectCallback is a function expression
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