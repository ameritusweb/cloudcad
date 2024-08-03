import React from 'react';
import { useHypeStudioModel } from '../context/HypeStudioContext';

const ImportExportButtons = () => {
  const model = useHypeStudioModel();

  const handleExport = () => {
    model.exportState();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      model.importState(file);
    }
  };

  return (
    <div>
      <button onClick={handleExport}>Export JSON</button>
      <input type="file" onChange={handleImport} accept=".json" />
    </div>
  );
};

export default ImportExportButtons;