import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export default function viteTracePlugin(options = {}) {
  const { include = [], exclude = [] } = options;

  return {
    name: 'vite-trace-plugin',
    enforce: 'pre',

    async transform(code, id) {
      if (!include.some(pattern => id.includes(pattern)) || exclude.some(pattern => id.includes(pattern))) {
        return null;
      }

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties']
      });

      let hasTracedFunctions = false;

      traverse.default(ast, {
        Program: {
          enter(path) {
            path.unshiftContainer('body', t.importDeclaration(
              [
                t.importSpecifier(t.identifier('traceFunction'), t.identifier('traceFunction')),
                t.importSpecifier(t.identifier('createProxy'), t.identifier('createProxy')),
                t.importSpecifier(t.identifier('traceClass'), t.identifier('traceClass'))
              ],
              t.stringLiteral('@/tracing/server/autoTracer')
            ));
          }
        },
        ClassMethod(path) {
          const functionName = path.node.key.name;

          if (functionName === 'constructor') {
            // Handle constructors
            path.get('body').unshiftContainer('body',
              t.expressionStatement(t.callExpression(
                t.identifier('traceFunction'),
                [t.stringLiteral('constructor')]
              ))
            );
          } else {
            const decorator = path.node.decorators?.find(d =>
              t.isCallExpression(d.expression) &&
              d.expression.callee.name === 'traceFunction'
            );

            if (decorator) {
              const localVars = decorator.expression.arguments.slice(1).map(arg => arg.value);
              wrapFunctionBody(path, functionName, localVars);
              path.node.decorators = path.node.decorators.filter(d => d !== decorator);
            } else {
              wrapFunctionBody(path, functionName, []);
            }
          }

          hasTracedFunctions = true;
        },
        FunctionDeclaration(path) {
          const functionName = path.node.id.name;
          const functionExpression = t.functionExpression(
            null,
            path.node.params,
            path.node.body
          );
          const tracedFunction = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(functionName),
              t.callExpression(
                t.identifier('createProxy'),
                [functionExpression, t.stringLiteral(functionName)]
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
        },
        ClassDeclaration(path) {
          const className = path.node.id.name;
          const decorator = path.node.decorators?.find(d =>
            t.isCallExpression(d.expression) &&
            d.expression.callee.name === 'traceClass'
          );

          if (decorator) {
            const classExpression = t.classExpression(
              path.node.id,
              path.node.superClass,
              path.node.body,
              path.node.decorators
            );

            const tracedClass = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(className),
                t.callExpression(
                  t.identifier('traceClass'),
                  [classExpression]
                )
              )
            ]);

            path.replaceWith(tracedClass);
            hasTracedFunctions = true;
          }
        }
      });

      if (!hasTracedFunctions) {
        return null;
      }

      const output = generate.default(ast, { sourceMaps: true, sourceFileName: id }, code);

      return {
        code: output.code,
        map: output.map
      };
    }
  };
}

// wrapFunctionBody from Version A
function wrapFunctionBody(path, functionName, localVars) {
  const originalBody = path.node.body;
  const wrappedBody = t.blockStatement([
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('__traceResult'),
        t.callExpression(
          t.identifier('traceFunction'),
          [
            t.functionExpression(null, path.node.params, originalBody),
            t.stringLiteral(functionName),
            ...localVars.map(varName => t.stringLiteral(varName))
          ]
        )
      )
    ]),
    t.returnStatement(t.identifier('__traceResult'))
  ]);

  path.get('body').replaceWith(wrappedBody);
}
