import React, { useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const SettingsView = () => {
  const model = useHypeStudioModel();
  const [projectName, setProjectName] = useState(model.getState('projectName'));
  const [units, setUnits] = useState(model.getState('units'));

  const handleProjectNameChange = (e) => setProjectName(e.target.value);
  const handleUnitsChange = (e) => setUnits(e.target.value);

  const handleSave = () => {
    model.setStateProperty('projectName', projectName)
    model.setStateProperty('units', units);
  };

  return (
    <div className="settings-view p-6 bg-white rounded-lg">
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Project Name:
          <input
            type="text"
            value={projectName}
            onChange={handleProjectNameChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Units:
          <input
            type="text"
            value={units}
            onChange={handleUnitsChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </label>
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};
