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
                t.importSpecifier(t.identifier('createProxy'), t.identifier('createProxy')),
                t.importSpecifier(t.identifier('traceClass'), t.identifier('traceClass')),
                t.importSpecifier(t.identifier('createObjectTrace'), t.identifier('createObjectTrace'))
              ],
              t.stringLiteral('@/tracing/server/autoTracer')
            ));
          }
        },
        ClassDeclaration(path) {
          const className = path.node.id ? path.node.id.name : 'AnonymousClass';
          
          const tracedClass = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(className),
              t.callExpression(
                t.identifier('traceClass'),
                [t.classExpression(
                  path.node.id,
                  path.node.superClass,
                  path.node.body,
                  path.node.decorators
                )]
              )
            )
          ]);

          path.replaceWith(tracedClass);
          hasTracedFunctions = true;
        },
        FunctionDeclaration(path) {
          const functionName = path.node.id.name;
          const tracedFunction = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(functionName),
              t.callExpression(
                t.identifier('createProxy'),
                [
                  t.functionExpression(
                    null,
                    path.node.params,
                    path.node.body
                  ),
                  t.stringLiteral(functionName)
                ]
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
        ImportDeclaration(path) {
          // Do nothing for import declarations
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