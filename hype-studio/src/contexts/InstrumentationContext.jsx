import React, { createContext, useState, useContext } from 'react';

const InstrumentationContext = createContext();

export const useInstrumentation = () => useContext(InstrumentationContext);

export const InstrumentationProvider = ({ children }) => {
  const [isInstrumentationEnabled, setIsInstrumentationEnabled] = useState(false);

  const toggleInstrumentation = () => {
    setIsInstrumentationEnabled(prev => !prev);
  };

  return (
    <InstrumentationContext.Provider value={{ isInstrumentationEnabled, toggleInstrumentation }}>
      {children}
    </InstrumentationContext.Provider>
  );
};