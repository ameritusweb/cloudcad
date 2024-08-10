import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';

export function traceCallback(callback, type) {
  return (...args) => {
    if (process.env.NODE_ENV !== 'development') return callback(...args);

    const stackTrace = captureStackTrace();
    console.log(`Callback triggered: ${type}`);
    console.log(`Arguments:`, args);
    console.log(`Stack Trace:\n${stackTrace}`);

    const { result, duration } = measurePerformance(callback, ...args);

    console.log(`Execution time for ${type} callback: ${duration.toFixed(2)}ms`);

    return result;
  };
}