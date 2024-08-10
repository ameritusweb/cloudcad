export function captureStackTrace() {
    if (process.env.NODE_ENV !== 'development') return '';
    
    const error = new Error();
    const stack = error.stack
      .split('\n')
      .slice(2)
      .map(line => line.trim())
      .join('\n');
  
    return stack;
  }