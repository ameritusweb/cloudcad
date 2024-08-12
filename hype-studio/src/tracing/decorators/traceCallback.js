import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';
import { sendTraceToServer } from '../utils/traceServerUtil';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export function createTraceCallback(model) {
  function isTracingEnabled() {
    return import.meta.env.DEV && document.documentElement.dataset.instrumentationEnabled === 'true';
  }

  function traceCallback(callback, type) {
    if (typeof callback !== 'function') {
      return callback;
    }

    return (...args) => {
      if (!isTracingEnabled()) {
        return callback(...args);
      }

      const stackTrace = captureStackTrace();
      console.log(`Callback triggered: ${type}`);
      console.log(`Arguments:`, args);
      console.log(`Stack Trace:\n${stackTrace}`);

      let wrappedCallback;
      try {
        wrappedCallback = wrapFunctionCalls(callback);
      } catch (error) {
        console.error('Error wrapping function calls:', error);
        wrappedCallback = callback;
      }

      const { result, duration } = measurePerformance(wrappedCallback, ...args);

      console.log(`Execution time for ${type} callback: ${duration.toFixed(2)}ms`);

      sendTraceToServer({
        type: 'callback',
        callbackType: type,
        arguments: args,
        stackTrace,
        duration,
        result
      });

      return result;
    };
  }

  function wrapFunctionCalls(fn) {
    const fnStr = fn.toString();
    let ast;
    try {
      ast = parse(fnStr, {
        sourceType: 'module',
        plugins: ['jsx']
      });
    } catch (error) {
      console.error('Error parsing function:', error);
      return fn;
    }

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.name === 'traceFunctionExecution') {
          return;
        }
        const callee = path.get('callee');
        if (callee.isIdentifier()) {
          const fnName = callee.node.name;
          path.replaceWith(
            t.callExpression(
              t.callExpression(
                t.identifier('traceFunctionExecution'),
                [
                  callee.node,
                  t.stringLiteral(fnName)
                ]
              ),
              path.node.arguments
            )
          );
        }
      }
    });

    let code;
    try {
      ({ code } = generate(ast, { retainLines: true, compact: false }));
    } catch (error) {
      console.error('Error generating code:', error);
      return fn;
    }

    try {
      return new Function('traceFunctionExecution', 'isTracingEnabled', 'captureStackTrace', 'sendTraceToServer', `
        return function ${fn.name || 'anonymous'}(...args) {
          ${code}
        }
      `)(traceFunctionExecution, isTracingEnabled, captureStackTrace, sendTraceToServer);
    } catch (error) {
      console.error('Error creating wrapped function:', error);
      return fn;
    }
  }

  function traceFunctionExecution(fn, fnName) {
    return function(...fnArgs) {
      if (!isTracingEnabled()) {
        return fn.apply(this, fnArgs);
      }

      const start = performance.now();
      const stackTrace = captureStackTrace();

      console.log(`Function ${fnName} called`);
      console.log(`Arguments:`, fnArgs);
      console.log(`Stack Trace:\n${stackTrace}`);

      let result;
      try {
        result = fn.apply(this, fnArgs);
      } catch (error) {
        console.error(`Error in function ${fnName}:`, error);
        throw error;
      }

      const duration = performance.now() - start;
      console.log(`Execution time for ${fnName}: ${duration.toFixed(2)}ms`);

      sendTraceToServer({
        type: 'function',
        functionName: fnName,
        arguments: fnArgs,
        stackTrace,
        duration,
        result
      });

      return result;
    };
  }

  return traceCallback;
}