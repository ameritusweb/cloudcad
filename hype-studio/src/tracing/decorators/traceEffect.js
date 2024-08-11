import { captureStackTrace } from '../utils/captureStackTrace';
import { measurePerformance } from '../utils/performance';
import { useInstrumentation } from '../../contexts/InstrumentationContext';

export function traceEffect(callback, dependencies, effectName) {
  const { isInstrumentationEnabled } = useInstrumentation();

  return () => {
    if (!import.meta.env.DEV || !isInstrumentationEnabled) return callback();

    const stackTrace = captureStackTrace();

    console.log(`useEffect triggered: ${effectName}`);
    console.log(`Dependencies:`, dependencies);
    console.log(`Stack Trace:\n${stackTrace}`);

    const { result: cleanup, duration } = measurePerformance(callback);

    console.log(`Execution time for useEffect (${effectName}): ${duration.toFixed(2)}ms`);

    return cleanup;
  };
}