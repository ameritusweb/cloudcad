import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { safeStringify, finishTrace, captureLocationInfo } from './tracingUtils';

const traceServer = 'http://localhost:3000/trace';

// Global execution stack
const executionStack = [];

export function createProxy(target, name, model) {
  return new Proxy(target, {
    apply(target, thisArg, argumentsList) {
      if (document.documentElement.dataset.instrumentationEnabled !== 'true') {
        return target.apply(thisArg, argumentsList);
      }
      const traceId = uuidv4();
      const parentTraceId = executionStack.length > 0 ? executionStack[executionStack.length - 1] : null;

      executionStack.push(traceId);

      let locationInfo;
      let localVars = {};
      const children = [];

      const captureLocation = () => {
        const stack = new Error().stack;
        locationInfo = captureLocationInfo(stack);
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
          return result.then(
            (value) => {
              finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, value, localVars, children, executionStack);
              return value;
            },
            (error) => {
              finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, undefined, localVars, children, executionStack, error);
              throw error;
            }
          );
        } else {
          finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, result, localVars, children, executionStack);
        }
      } catch (error) {
        finishTrace(traceId, parentTraceId, name, locationInfo, target, argumentsList, undefined, localVars, children, executionStack, error);
        throw error;
      } finally {
        const index = executionStack.indexOf(traceId);
        if (index > -1) {
          executionStack.splice(index, 1);
        }
      }

      return result;
    }
  });
}

export function traceClass(target) {

  if (document.documentElement.dataset.instrumentationEnabled !== 'true') {
    return target;
  }

  // If target is not a function or is an import/require, return it unchanged
  if (typeof target !== 'function' || target.toString().startsWith('function require(')) {
      console.warn('traceClass was called with an invalid target:', target);
      return target;
  }

  // Check if target is a class constructor
  if (target.prototype && target.prototype.constructor === target) {
      const originalConstructor = target;
      const newConstructor = function(...args) {
          const instance = new originalConstructor(...args);
          const traceId = uuidv4();
          console.log(`Creating instance of: ${originalConstructor.name || 'AnonymousClass'}`);
          
          // Send trace data to server
          axios.post(traceServer, {
              traceId,
              className: originalConstructor.name || 'AnonymousClass',
              args: safeStringify(args)
          }).catch(err => console.error('Failed to send trace data:', err));
          
          // Wrap all methods of the instance
          Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).forEach(key => {
              if (typeof instance[key] === 'function' && key !== 'constructor') {
                  instance[key] = createProxy(instance[key], key);
              }
          });
          
          return instance;
      };
      
      // Preserve the prototype chain
      newConstructor.prototype = originalConstructor.prototype;
      
      // Copy static properties
      Object.setPrototypeOf(newConstructor, originalConstructor);
      
      // Preserve the original name and length properties
      Object.defineProperties(newConstructor, {
          name: { value: originalConstructor.name, configurable: true },
          length: { value: originalConstructor.length, configurable: true }
      });
      
      return newConstructor;
  }

  // If it's a regular function, just return a proxied version
  return createProxy(target, target.name || 'anonymous');
}

export function createObjectTrace(objectToTrace) {
  function traceMethod(method, methodName) {
    return createProxy(method, methodName);
  }

  function traceMethods(obj) {
    Object.getOwnPropertyNames(obj).forEach(key => {
      if (typeof obj[key] === 'function' && key !== 'constructor') {
        obj[key] = traceMethod(obj[key], key);
      }
    });
  }

  traceMethods(objectToTrace);
  traceMethods(Object.getPrototypeOf(objectToTrace));

  return objectToTrace;
}