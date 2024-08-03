// src/components/AutosaveControl.js

import React, { useState, useEffect, useRef } from 'react';
import { useHypeStudioModel } from '../context/HypeStudioContext';

const AutosaveControl = () => {
  const model = useHypeStudioModel();
  const [interval, setInterval] = useState(model.getState('autosaveInterval'));
  const autosaveRef = useRef(null);

  useEffect(() => {
    setInterval(model.getState('autosaveInterval'));
  }, [model]);

  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value, 10);
    setInterval(newInterval);
    model.setAutosaveInterval(newInterval);
    model.startAutosave();
  };

  const handleToggleAutosave = () => {
    if (autosaveRef.current) {
      model.stopAutosave();
      autosaveRef.current = null;
    } else {
      model.startAutosave();
      autosaveRef.current = model.startAutosave;
    }
  };

  return (
    <div>
      <label>
        Autosave Interval (ms):
        <input
          type="number"
          value={interval}
          onChange={handleIntervalChange}
          min="1000"
        />
      </label>
      <button onClick={handleToggleAutosave}>
        {autosaveRef.current ? 'Stop Autosave' : 'Start Autosave'}
      </button>
    </div>
  );
};

export default AutosaveControl;
