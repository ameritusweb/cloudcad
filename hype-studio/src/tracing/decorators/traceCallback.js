import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';

export function createTraceCallback(model) {
  return function traceCallback(callback, type) {
    return (...args) => {
      if (!import.meta.env.DEV || document.documentElement.dataset.instrumentationEnabled !== 'true') {
        return callback(...args);
      }

      const stackTrace = captureStackTrace();
      console.log(`Callback triggered: ${type}`);
      console.log(`Arguments:`, args);
      console.log(`Stack Trace:\n${stackTrace}`);

      // Wrap the callback to trace each function call within it
      const wrappedCallback = wrapFunctionCalls(callback);

      const { result, duration } = measurePerformance(wrappedCallback, ...args);

      console.log(`Execution time for ${type} callback: ${duration.toFixed(2)}ms`);

      return result;
    };
  };

  function wrapFunctionCalls(fn) {
    const fnStr = fn.toString();

    // This simplistic approach replaces function calls with traced versions
    const wrappedFnStr = fnStr.replace(/(\w+)\(([^)]*)\)/g, (match, fnName, fnArgs) => {
      return `traceFunctionExecution(${fnName}, '${fnName}')(${fnArgs})`;
    });

    return new Function(`return (${wrappedFnStr})`)();
  }

  function traceFunctionExecution(fn, fnName) {
    return function(...fnArgs) {
      const start = performance.now();
      const stackTrace = captureStackTrace();

      console.log(`Function ${fnName} called`);
      console.log(`Arguments:`, fnArgs);
      console.log(`Stack Trace:\n${stackTrace}`);

      const result = fn(...fnArgs);

      const duration = performance.now() - start;
      console.log(`Execution time for ${fnName}: ${duration.toFixed(2)}ms`);

      return result;
    };
  }
}
