import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';
import { sendTraceToServer } from '../utils/traceServerUtil';

export function traceEffect(callback, dependencies, effectName) {
    if (!import.meta.env.DEV || document.documentElement.dataset.instrumentationEnabled !== 'true') return callback();

    const stackTrace = captureStackTrace();
    const callbackSource = callback.toString();

    console.log(`useEffect triggered: ${effectName}`);
    console.log(`Dependencies:`, dependencies);
    

    const { result: cleanup, duration } = measurePerformance(callback);

    console.log(`Execution time for useEffect (${effectName}): ${duration.toFixed(2)}ms`);

    sendTraceToServer({
      type: 'effect',
      effectName,
      dependencies,
      stackTrace,
      callbackSource,
      duration,
      cleanup: cleanup ? 'present' : 'absent'
    });

    return cleanup;
}