import React, { useState, useCallback, memo } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';

const formatVector = (vector) => {
  return `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)})`;
};

export const PropertyPanel = memo(() => {
  const model = useHypeStudioModel();
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const selectedPart = useHypeStudioState('selectedPart', null);
  const customProperties = useHypeStudioState('customProperties', {});
  const [modifiedProperties, setModifiedProperties] = useState({});
  const [errors, setErrors] = useState({});

  // Use versioning hook
  const version = useVersioning(['selectedElementId', 'selectedPart', 'elements', 'customProperties']);

  const selectedElement = selectedElementId ? model.getElementById(selectedElementId) : null;

  const handlePropertyChange = useCallback((propertyName, value) => {
    setModifiedProperties(prev => ({
      ...prev,
      [propertyName]: value
    }));
  }, []);

  const applyChanges = useCallback(() => {
    Object.entries(modifiedProperties).forEach(([propertyName, value]) => {
      if (customProperties[selectedElementId] && propertyName in customProperties[selectedElementId]) {
        const success = model.setCustomProperty(selectedElementId, propertyName, value);
        if (!success) {
          setErrors(prev => ({
            ...prev,
            [propertyName]: 'Invalid value'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            [propertyName]: undefined
          }));
        }
      } else {
        model.updateElement(selectedElementId.split('_')[0], selectedElementId, { [propertyName]: value });
      }
    });
    setModifiedProperties({});
  }, [model, selectedElementId, modifiedProperties, customProperties]);

  const renderPropertyInput = useCallback((propertyName, value, isCustom = false) => {
    const currentValue = modifiedProperties[propertyName] !== undefined ? modifiedProperties[propertyName] : value;
    const isModified = modifiedProperties[propertyName] !== undefined;
    const error = errors[propertyName];

    return (
      <div key={propertyName} className={`mb-2 ${isModified ? 'modified' : ''} ${error ? 'error' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          {propertyName}:
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={currentValue}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 ${isModified ? 'bg-yellow-100' : ''}`}
          />
        </label>
        {error && <div className="text-red-500 text-xs">{error}</div>}
      </div>
    );
  }, [modifiedProperties, errors, handlePropertyChange]);

  const renderSketchProperties = useCallback(() => {
    if (!selectedElement) return null;
    switch (selectedElement.type) {
      case 'circle':
        return renderPropertyInput('radius', selectedElement.radius || 0);
      case 'rectangle':
        return (
          <>
            {renderPropertyInput('width', selectedElement.width || 0)}
            {renderPropertyInput('height', selectedElement.height || 0)}
          </>
        );
      default:
        return null;
    }
  }, [selectedElement, renderPropertyInput]);

  const renderSelectedPartInfo = () => {
    if (!selectedPart) return null;

    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">Selected Part</h3>
        <p>Type: {selectedPart.type}</p>
        {selectedPart.part && <p>Part: {selectedPart.part}</p>}
        {renderPartDetails()}
      </div>
    );
  };

  const renderPartDetails = () => {
    switch (selectedPart.type) {
      case 'edge':
        if (selectedPart.data.start && selectedPart.data.end) {
          return (
            <>
              <p>Start: {formatVector(selectedPart.data.start)}</p>
              <p>End: {formatVector(selectedPart.data.end)}</p>
            </>
          );
        } else {
          return <p>Edge Index: {selectedPart.data}</p>;
        }
      case 'face':
        if (selectedPart.data.normal) {
          return <p>Normal: {formatVector(selectedPart.data.normal)}</p>;
        } else {
          return <p>Face Index: {selectedPart.data}</p>;
        }
      case 'mesh':
        return <p>Entire mesh selected</p>;
      default:
        return null;
    }
  };

  if (!selectedElement && !selectedPart) {
    return (
      <div className='w-48 bg-white p-2 z-10'>
        <h2 className="font-bold mb-2 p-2">Properties View</h2>
        <div className="w-48 bg-white p-2">No element or part selected</div>
      </div>
    );
  }

  return (
    <div className="w-48 bg-white p-2 z-10" id={`property-panel-${version}`}>
      {selectedElement && (
        <>
          <h2 className="font-bold mb-2">Properties: {selectedElement.name || selectedElement.id}</h2>
          {renderPropertyInput('name', selectedElement.name || '')}
          {renderSketchProperties()}
          <h3 className="font-bold mt-4 mb-2">Custom Properties</h3>
          {Object.entries(customProperties[selectedElementId] || {}).map(([key, value]) => 
            renderPropertyInput(key, value, true)
          )}
          {Object.keys(modifiedProperties).length > 0 && (
            <button 
              onClick={applyChanges}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Apply Changes
            </button>
          )}
        </>
      )}
      {renderSelectedPartInfo()}
    </div>
  );
});