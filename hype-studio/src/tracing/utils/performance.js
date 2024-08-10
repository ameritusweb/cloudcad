export function measurePerformance(fn, ...args) {
    if (process.env.NODE_ENV !== 'development') return fn(...args);
  
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;
  
    return { result, duration };
  }