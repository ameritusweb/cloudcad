import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const traceServer = 'http://localhost:3000/trace';

// Global execution stack
const executionStack = [];

export function traceFunction(...localVarNames) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const traceId = uuidv4();
      const parentTraceId = executionStack.length > 0 ? executionStack[executionStack.length - 1] : null;
      
      executionStack.push(traceId);

      let locationInfo;
      let localVars = {};
      const children = [];
      
      const captureLocation = () => {
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[2];
        const match = callerLine.match(/at (?:.*\.)?(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        locationInfo = {
          fileName: match[2],
          lineNumber: match[3],
          columnNumber: match[4]
        };
      };

      captureLocation();
      
      global.traceConsole = (varName, value) => {
        localVars[varName] = value;
      };
      
      global.traceChild = (childTraceId) => {
        children.push(childTraceId);
      };
      
      let result;
      try {
        result = originalMethod.apply(this, args);
      } finally {
        executionStack.pop();
        
        delete global.traceConsole;
        delete global.traceChild;
        
        axios.post(traceServer, {
          traceId,
          parentTraceId,
          fileName: locationInfo.fileName,
          functionName: propertyKey,
          lineNumber: locationInfo.lineNumber,
          columnNumber: locationInfo.columnNumber,
          code: originalMethod.toString(),
          args,
          returnValue: result,
          localVars,
          children
        });
      }
      
      if (parentTraceId) {
        global.traceChild(traceId);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

global.traceConsole = () => {};
global.traceChild = () => {};