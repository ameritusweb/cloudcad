import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';
import { sendTraceToServer } from '../utils/traceServerUtil';

export function traceUseCallback(callback, dependencies, callbackName, args) {
    if (!import.meta.env.DEV || document.documentElement.dataset.instrumentationEnabled !== 'true') {
      return callback(...args);
    }
  
    const stackTrace = captureStackTrace();
    const callbackSource = callback.toString();
  
    console.log(`useCallback invoked: ${callbackName}`);
    console.log(`Arguments:`, args);
    console.log(`Dependencies:`, dependencies);
    console.log(`Stack Trace:\n${stackTrace}`);
    console.log(`Callback Source:\n${callbackSource}`);
  
    const { result: cleanup, duration } = measurePerformance(() => callback(...args));

    console.log(`Execution time for useCallback (${callbackName}): ${duration.toFixed(2)}ms`);

    sendTraceToServer({
      type: 'useCallback',
      callbackName,
      dependencies,
      stackTrace,
      callbackSource,
      duration,
      cleanup: cleanup ? 'present' : 'absent'
    });

    return cleanup;
}