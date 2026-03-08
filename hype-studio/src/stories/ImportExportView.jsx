import React, { useRef, useState } from 'react';
import { FaFileDownload, FaFileUpload, FaTrash } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

export const ImportExportView = () => {
  const model = useHypeStudioModel();
  const projectName = useHypeStudioState('projectName', 'My Project');
  const elements = useHypeStudioState('elements', {});
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const sketchCount = Object.keys(elements.sketches ?? {}).length;
  const shapeCount = Object.keys(elements.shapes ?? {}).length;
  const extrusionCount = Object.keys(elements.extrusions ?? {}).length;

  const handleExport = () => {
    model.exportState();
  };

  const handleImportClick = () => {
    setImportError('');
    setImportSuccess(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await model.importState(file);
      setImportSuccess(true);
      setImportError('');
    } catch (err) {
      setImportError('Failed to import file. Make sure it is a valid HypeStudio JSON.');
    }
    e.target.value = '';
  };

  const handleClear = () => {
    if (!window.confirm('Clear all elements and reset the project?')) return;
    model.clearState();
    model.setState(() => ({
      projectName: 'My Project',
      dimensions: '20mm x 40mm x 20mm',
      units: 'mm',
      elements: { sketches: {}, extrusions: {}, shapes: {} },
      groups: [],
      camera: { position: null, target: null },
      customProperties: {},
      selectedElementId: null,
      selectedElement: null,
      selectedPart: null,
      draggedItem: null,
      activeView: 'List View',
      leftPanelContent: [],
      rulerMarkings: [],
      currentModelView: '',
      controlMode: 'rotate',
      customPlanes: [],
      planeStates: { X: 'hidden', Y: 'hidden', Z: 'hidden' },
      selectedSketchType: null,
      secondarySketchId: null,
      snapSettings: { gridEnabled: true, gridSize: 1, snapToEndpoints: true, snapThreshold: 0.3 },
      constraints: {},
      autosaveInterval: 30000,
      stateVersion: '1.0.0',
    }), false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Import / Export</h3>

      {/* Project summary */}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-1">
        <p className="text-sm font-medium text-gray-700">{projectName}</p>
        <p className="text-xs text-gray-500">
          {sketchCount} sketch{sketchCount !== 1 ? 'es' : ''} · {shapeCount} shape{shapeCount !== 1 ? 's' : ''} · {extrusionCount} extrusion{extrusionCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <button onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
          <FaFileDownload /> Export JSON
        </button>

        <button onClick={handleImportClick}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
          <FaFileUpload /> Import JSON
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {importError && <p className="text-xs text-red-600">{importError}</p>}
        {importSuccess && <p className="text-xs text-green-600">Project imported successfully.</p>}

        <hr className="border-gray-200" />

        <button onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-500 border border-red-300 font-bold py-2 px-4 rounded-md transition-colors">
          <FaTrash /> Clear Project
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Exports the current project as a JSON file. Import replaces all current elements.
      </p>
    </div>
  );
};
