// useHypeStudioState.js
import { useEffect, useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export function useHypeStudioState(key, defaultValue) {
    const model = useHypeStudioModel();
    const [value, setValue] = useState(() => {
      const stateValue = model.getState(key);
      if (stateValue === undefined) {
        console.warn(`Warning: Using default value for '${key}'. Consider adding it to the initial state.`);
        return defaultValue;
      }
      return stateValue;
    });
  
    useEffect(() => {
      const subscription = model.subscribe(key, newValue => {
        if (newValue === undefined) {
          console.warn(`Warning: Received undefined value for '${key}'. Using default value.`);
          setValue(defaultValue);
        } else {
          setValue(newValue);
        }
      });
      return () => subscription.unsubscribe();
    }, [model, key, defaultValue]);
  
    return value;
  }