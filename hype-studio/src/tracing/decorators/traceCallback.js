import { measurePerformance } from '../utils/performance';
import { sendTraceToServer } from '../utils/traceServerUtil';

function isTracingEnabled() {
  return process.env.NODE_ENV === 'development' && document.documentElement.dataset.instrumentationEnabled === 'true';
}

function createTraceProxy(target, options = {}) {
  const { name, type, filename } = options;

  return new Proxy(target, {
    apply(target, thisArg, args) {
      if (!isTracingEnabled()) {
        return Reflect.apply(target, thisArg, args);
      }

      const stackTrace = new Error().stack;
      const code = target.toString();
      console.log(`${type || 'Function'} ${name || 'anonymous'} called`);
      console.log(`Arguments:`, args);
      console.log(`Stack Trace:\n${stackTrace}`);

      const { result, duration } = measurePerformance(() => {
        try {
          return Reflect.apply(target, thisArg, args);
        } catch (error) {
          console.error(`Error in ${type || 'function'} ${name || 'anonymous'}:`, error);
          throw error;
        }
      });

      console.log(`Execution time for ${name || 'anonymous'}: ${duration.toFixed(2)}ms`);

      sendTraceToServer({
        type: type || 'function',
        name: name || 'anonymous',
        arguments: args,
        stackTrace,
        code,
        duration,
        result,
        filename
      });

      return result;
    }
  });
}

export function traceCallback(callback, type, filename) {
  if (typeof callback !== 'function') {
    return callback;
  }

  return createTraceProxy(callback, { type, name: type, filename });
}