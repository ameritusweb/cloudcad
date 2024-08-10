import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';

export function traceEffect(callback, dependencies, effectName) {
  return () => {
    if (process.env.NODE_ENV !== 'development') return callback();

    const stackTrace = captureStackTrace();

    console.log(`useEffect triggered: ${effectName}`);
    console.log(`Dependencies:`, dependencies);
    console.log(`Stack Trace:\n${stackTrace}`);

    const { result: cleanup, duration } = measurePerformance(callback);

    console.log(`Execution time for useEffect (${effectName}): ${duration.toFixed(2)}ms`);

    return cleanup;
  };
}