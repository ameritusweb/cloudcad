import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export default function viteTracePlugin(options = {}) {
  const { include = [], exclude = [] } = options;

  return {
    name: 'vite-trace-plugin',
    enforce: 'pre', // This ensures our plugin runs before other plugins

    transform(code, id) {
      if (!include.some(pattern => id.includes(pattern)) || exclude.some(pattern => id.includes(pattern))) {
        return null;
      }

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let hasTracedFunctions = false;

      traverse(ast, {
        Program: {
          enter(path) {
            path.unshiftContainer('body', t.importDeclaration(
              [
                t.importSpecifier(t.identifier('traceFunction'), t.identifier('traceFunction')),
                t.importSpecifier(t.identifier('createProxy'), t.identifier('createProxy'))
              ],
              t.stringLiteral('@/tracing/server/autoTracer')
            ));
          }
        },
        ClassMethod(path) {
          const decorator = path.node.decorators?.find(d => 
            t.isCallExpression(d.expression) && 
            d.expression.callee.name === 'traceFunction'
          );

          if (decorator) {
            hasTracedFunctions = true;
            // The decorator is already present, no need to modify
          } else {
            // Automatically add traceFunction decorator
            const functionName = path.node.key.name;
            path.node.decorators = path.node.decorators || [];
            path.node.decorators.push(
              t.decorator(
                t.callExpression(
                  t.identifier('traceFunction'),
                  [t.stringLiteral(functionName)]
                )
              )
            );
            hasTracedFunctions = true;
          }
        },
        FunctionDeclaration(path) {
          const functionName = path.node.id.name;
          const tracedFunction = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(functionName),
              t.callExpression(
                t.identifier('createProxy'),
                [path.node, t.stringLiteral(functionName)]
              )
            )
          ]);
          path.replaceWith(tracedFunction);
          hasTracedFunctions = true;
        },
        ArrowFunctionExpression(path) {
          if (path.parent.type === 'VariableDeclarator') {
            const functionName = path.parent.id.name;
            const tracedFunction = t.callExpression(
              t.identifier('createProxy'),
              [path.node, t.stringLiteral(functionName)]
            );
            path.replaceWith(tracedFunction);
            hasTracedFunctions = true;
          }
        }
      });

      if (!hasTracedFunctions) {
        return null;
      }

      const output = generate(ast, { sourceMaps: true, sourceFileName: id }, code);

      return {
        code: output.code,
        map: output.map
      };
    }
  };
}