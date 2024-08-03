// src/utils/ioUtils.js

import { saveStateToLocalStorage } from '../utils/storageUtils';

export const exportStateToJSON = (model) => {
  const stateJSON = model.toJSON();
  const blob = new Blob([stateJSON], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hypeStudioState.json';
  a.click();
  
  URL.revokeObjectURL(url);
};

export const importStateFromJSON = async (file, model) => {
  const reader = new FileReader();
  reader.readAsText(file);
  
  reader.onload = (event) => {
    const json = event.target.result;
    model.fromJSON(json);
    saveStateToLocalStorage(model);  // Save imported state to localStorage
  };
  
  reader.onerror = (error) => {
    console.error('Error reading JSON file:', error);
  };
};
