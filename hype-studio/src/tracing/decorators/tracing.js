// tracing-decorators.js
import React from 'react';
import { traceEffect } from './traceEffect';
import { traceUseCallback } from './traceUseCallback';

export function TraceEffect(effectNameOrOptions) {
    return function(target, key, descriptor) {
      const originalMethod = descriptor.value;
      const effectName = typeof effectNameOrOptions === 'string' ? effectNameOrOptions : key;
      const deps = Array.isArray(effectNameOrOptions) ? effectNameOrOptions : [];
  
      descriptor.value = function() {
        React.useEffect(
          traceEffect(originalMethod.bind(this), deps, effectName),
          deps
        );
      };
      return descriptor;
    };
  }

export function TraceCallback(callbackNameOrOptions, condition = () => true) {
  return function(target, key, descriptor) {
    const originalMethod = descriptor.value;
    let callbackName, deps;

    if (typeof callbackNameOrOptions === 'string') {
      callbackName = callbackNameOrOptions;
      deps = [];
    } else if (Array.isArray(callbackNameOrOptions)) {
      callbackName = key;
      deps = callbackNameOrOptions;
    } else if (typeof callbackNameOrOptions === 'object') {
      callbackName = callbackNameOrOptions.name || key;
      deps = callbackNameOrOptions.deps || [];
      condition = callbackNameOrOptions.condition || condition;
    } else {
      callbackName = key;
      deps = [];
    }

    descriptor.value = function(...args) {
      return React.useCallback(
        (...callbackArgs) => {
          if (condition(...callbackArgs)) {
            return traceUseCallback(originalMethod.bind(this), deps, callbackName)(...callbackArgs);
          }
          // If condition is false, just return without executing or tracing
          return undefined;
        },
        deps
      );
    };
    return descriptor;
  };
}