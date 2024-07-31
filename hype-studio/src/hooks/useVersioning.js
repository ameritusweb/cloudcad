import { useState, useEffect } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const useVersioning = (propertyNames) => {
  const [version, setVersion] = useState(0);
  const model = useHypeStudioModel();

  useEffect(() => {
    const subscriptions = propertyNames.map(propertyName => 
      model.subscribe(propertyName, () => {
        setVersion(v => v + 1);
      })
    );

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [model, propertyNames]);

  return version;
};