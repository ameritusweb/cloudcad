import axios from 'axios';

const traceServer = 'http://localhost:3000/trace';

export function captureLocationInfo(stack) {

  const callerLine = stack.split('\n')[3]; // [0] is Error, [1] is captureLocation, [2] is Proxy, [3] is the actual function
  const match = callerLine.match(/at (?:.*\.)?(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
  const match2 = callerLine.match(/at\s+(.*):(\d+):(\d+)/);
  
  if (!match2) {
    return {
      fileName: '',
      lineNumber: '',
      columnNumber: ''
    };
  }
  
  const parts = match2[1].trim().split('/'); // Split by '/'
  const fileName = parts[parts.length - 1];
  return {
    fileName,
    lineNumber: match[3],
    columnNumber: match[4]
  };
}

// Utility to safely stringify objects with circular references, max property count, max depth, and omit properties starting with "_"
export function safeStringify(obj, maxDepth = 5, maxProperties = 10) {
  const seen = new WeakSet();

  function stringify(value, depth = 0, propertyCount = 0) {
    if (depth > maxDepth) return '[Max Depth Reached]';
    if (propertyCount > maxProperties) return '[Max Properties Reached]';

    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);

      if (Array.isArray(value)) {
        return value.map(item => stringify(item, depth + 1, propertyCount + 1));
      }

      const keys = Object.keys(value).filter(key => !key.startsWith('_'));
      const limitedKeys = keys.slice(0, maxProperties);

      const result = limitedKeys.reduce((acc, key) => {
        acc[key] = stringify(value[key], depth + 1, propertyCount + 1);
        return acc;
      }, {});

      if (keys.length > maxProperties) {
        result['[...]'] = '[More Properties]';
      }

      return result;
    }

    return value;
  }

  return JSON.stringify(stringify(obj));
}

export function finishTrace(traceId, parentTraceId, name, locationInfo, target, args, returnValue, localVars, children, executionStack, error = null) {
  const traceData = {
    traceId,
    parentTraceId,
    fileName: locationInfo?.fileName,
    functionName: name,
    lineNumber: locationInfo?.lineNumber,
    columnNumber: locationInfo?.columnNumber,
    code: target.toString(),
    args: safeStringify(args),
    returnValue: safeStringify(returnValue),
    localVars: safeStringify(localVars),
    children,
    error: error ? error.toString() : null
  };

  axios.post(traceServer, traceData)
    .catch(err => console.error('Failed to send trace data:', err));

  if (parentTraceId && executionStack.includes(parentTraceId)) {
    const parentIndex = executionStack.indexOf(parentTraceId);
    if (parentIndex !== -1 && Array.isArray(executionStack[parentIndex]?.children)) {
      executionStack[parentIndex].children.push(traceId);
    }
  }
}