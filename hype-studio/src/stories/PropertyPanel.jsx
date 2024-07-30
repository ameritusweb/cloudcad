import React, { useState, useEffect } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const PropertyPanel = () => {
  const model = useHypeStudioModel();
  const [selectedElement, setSelectedElement] = useState(null);
  const [modifiedProperties, setModifiedProperties] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (model.selectedElementId) {
      setSelectedElement(getSelectedElement(model));
      setModifiedProperties({});
      setErrors({});
    } else {
      setSelectedElement(null);
    }
  }, [model.selectedElementId, model]);

  if (!selectedElement) {
    return <div className="w-48 bg-white p-2">No element selected</div>;
  }

  const handlePropertyChange = (propertyName, value) => {
    setModifiedProperties({
      ...modifiedProperties,
      [propertyName]: value
    });
  };

  const applyChanges = () => {
    Object.entries(modifiedProperties).forEach(([propertyName, value]) => {
      if (model.customProperties[selectedElement.id] && propertyName in model.customProperties[selectedElement.id]) {
        const success = model.setCustomProperty(selectedElement.id, propertyName, value);
        if (!success) {
          setErrors({
            ...errors,
            [propertyName]: 'Invalid value'
          });
        } else {
          setErrors({
            ...errors,
            [propertyName]: undefined
          });
        }
      } else {
        model.updateElement(selectedElement.id.split('_')[0], selectedElement.id, { [propertyName]: value });
      }
    });
    setModifiedProperties({});
  };

  const renderPropertyInput = (propertyName, value, isCustom = false) => {
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
  };

  const renderSketchProperties = () => {
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
  };

  return (
    <div className="w-48 bg-white p-2">
      <h2 className="font-bold mb-2">Properties: {selectedElement.name || selectedElement.id}</h2>
      {renderPropertyInput('name', selectedElement.name || '')}
      {renderSketchProperties()}
      <h3 className="font-bold mt-4 mb-2">Custom Properties</h3>
      {Object.entries(model.customProperties[selectedElement.id] || {}).map(([key, value]) => 
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
    </div>
  );
};

const getSelectedElement = (model) => {
  if (!model.selectedElementId) return null;
  const elementType = model.selectedElementId.split('_')[0];
  const elementByType = model.elements[elementType];
  if (!elementByType) return null;
  return elementByType[model.selectedElementId];
};