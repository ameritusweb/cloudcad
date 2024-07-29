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
    return <div>No element selected</div>;
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
        model.updateElementProperty(selectedElement.id, propertyName, value);
      }
    });
    setModifiedProperties({});
  };

  const renderPropertyInput = (propertyName, value, isCustom = false) => {
    const currentValue = modifiedProperties[propertyName] !== undefined ? modifiedProperties[propertyName] : value;
    const isModified = modifiedProperties[propertyName] !== undefined;
    const error = errors[propertyName];

    return (
      <div key={propertyName} className={`property-input ${isModified ? 'modified' : ''} ${error ? 'error' : ''}`}>
        <label>
          {propertyName}:
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={currentValue}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            style={{ backgroundColor: isModified ? '#fffacd' : 'white' }}
          />
        </label>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  };

  return (
    <div className="property-panel">
      <h2>Properties: {selectedElement.name}</h2>
      {Object.entries(selectedElement).map(([key, value]) => 
        key !== 'id' && renderPropertyInput(key, value)
      )}
      <h3>Custom Properties</h3>
      {Object.entries(model.customProperties[selectedElement.id] || {}).map(([key, value]) => 
        renderPropertyInput(key, value, true)
      )}
      {Object.keys(modifiedProperties).length > 0 && (
        <button onClick={applyChanges}>Apply Changes</button>
      )}
    </div>
  );
};

const getSelectedElement = (model) => {
  if (!model.selectedElementId) return null;
  console.log(model);
  const elementType = model.selectedElementId.split('_')[0];
  return model.elements[elementType][model.selectedElementId];
};