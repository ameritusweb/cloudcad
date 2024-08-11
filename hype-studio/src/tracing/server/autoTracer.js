import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const traceServer = 'http://localhost:3000/trace';

// Global execution stack
const executionStack = [];

export function createProxy(target, name) {
  return new Proxy(target, {
    apply(target, thisArg, argumentsList) {
      const traceId = uuidv4();
      const parentTraceId = executionStack.length > 0 ? executionStack[executionStack.length - 1] : null;
      
      executionStack.push(traceId);

      let locationInfo;
      let localVars = {};
      const children = [];

      const captureLocation = () => {
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[3]; // [0] is Error, [1] is captureLocation, [2] is Proxy, [3] is the actual function
        const match = callerLine.match(/at (?:.*\.)?(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        locationInfo = {
          fileName: match[2],
          lineNumber: match[3],
          columnNumber: match[4]
        };
      };

      captureLocation();

      const traceConsole = (varName, value) => {
        localVars[varName] = value;
      };

      const traceChild = (childTraceId) => {
        children.push(childTraceId);
      };

      let result;
      try {
        result = target.apply(thisArg, argumentsList);

        if (result instanceof Promise) {
          return result.finally(() => {
            finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, result, localVars, children);
          });
        } else {
          finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, result, localVars, children);
        }
      } catch (error) {
        finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, undefined, localVars, children, error);
        throw error;
      } finally {
        executionStack.pop();
      }

      return result;
    }
  });
}

function finishTrace(traceId, parentTraceId, name, locationInfo, target, args, returnValue, localVars, children, error = null) {
  axios.post(traceServer, {
    traceId,
    parentTraceId,
    fileName: locationInfo.fileName,
    functionName: name,
    lineNumber: locationInfo.lineNumber,
    columnNumber: locationInfo.columnNumber,
    code: target.toString(),
    args,
    returnValue,
    localVars,
    children,
    error: error ? error.toString() : null
  }).catch(err => console.error('Failed to send trace data:', err));

  if (parentTraceId) {
    const parentIndex = executionStack.indexOf(parentTraceId);
    if (parentIndex !== -1) {
      const parent = executionStack[parentIndex];
      parent.children.push(traceId);
    }
  }
}

export function traceFunction(fn, functionName, ...localVarNames) {
  return function(...args) {
    const traceId = uuidv4();
    const start = performance.now();
    
    let result;
    try {
      result = fn.apply(this, args);
    } finally {
      const end = performance.now();
      const duration = end - start;

      const localVars = {};
      localVarNames.forEach(varName => {
        if (typeof this[varName] !== 'undefined') {
          localVars[varName] = this[varName];
        }
      });

      axios.post(traceServer, {
        traceId,
        functionName,
        args,
        result,
        duration,
        localVars
      }).catch(error => console.error('Failed to send trace:', error));
    }

    return result;
  };
}

export function traceClass(constructor) {
  const originalConstructor = constructor;
  const newConstructor = function(...args) {
    const instance = new originalConstructor(...args);
    const traceId = uuidv4();
    console.log(`Creating instance of: ${constructor.name}`);
    // Send trace data to server
    axios.post(traceServer, {
      traceId,
      className: constructor.name,
      args
    }).catch(err => console.error('Failed to send trace data:', err));
    return instance;
  };
  newConstructor.prototype = originalConstructor.prototype;
  return newConstructor;
}