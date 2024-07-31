import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import EnhancedZenObservable from '../observables/EnhancedZenObservable';

const initialHypeStudioState = {
  projectName: 'My Project',
  dimensions: '20mm x 40mm x 20mm',
  units: 'mm',
  elements: {
    sketches: {},
    extrusions: {},
    // Add other element types as needed
  },
  customProperties: {},
  selectedElementId: null,
  activeView: 'List View',
  leftPanelContent: [],
  currentModelView: '',
  controlMode: 'rotate',
  planeStates: {
    X: 'hidden',
    Y: 'hidden',
    Z: 'hidden'
  },
  selectedSketchType: null,
};

const HypeStudioContext = createContext(null);

const createHypeStudioModel = () => {
  const model = new EnhancedZenObservable(initialHypeStudioState);

  model.createSketch = function(sketchData) {
    const id = this.addElement('sketches', sketchData);
    return id;
  };

  model.getSketchById = function(id) {
    return this.getState(`elements.sketches.${id}`);
  };

  model.updateSketch = function(id, updates) {
    this.updateElement('sketches', id, updates);
  };

  model.setProjectName = function(name) {
    this.setState(state => ({ ...state, projectName: name }));
  };

  model.addElement = function(type, element) {
    const id = `${type}_${Date.now()}`;
    this.setState(state => {
      const newElements = { ...state.elements };
      newElements[type][id] = { ...element, id };
      return { ...state, elements: newElements };
    });
    return id;
  };

  model.updateElement = function(type, id, updates) {
    this.setState(state => {
      const updatedElements = { ...state.elements };
      if (!updatedElements[type][id]) {
        console.error(`Element not found: ${type} ${id}`);
        return state;
      }
      updatedElements[type][id] = { ...updatedElements[type][id], ...updates };
      return { ...state, elements: updatedElements };
    });
  };

  model.deleteElement = function(type, id) {
    this.setState(state => {
      const newElements = { ...state.elements };
      if (!newElements[type][id]) {
        console.error(`Element not found: ${type} ${id}`);
        return state;
      }
      delete newElements[type][id];
      return { ...state, elements: newElements };
    });
  };

  model.selectElement = function(elementId) {
    this.setState(state => ({ ...state, selectedElementId: elementId }));
  };

  model.setCustomProperty = function(elementId, propertyName, value) {
    if (!this.validateCustomProperty(propertyName, value)) {
      console.error(`Invalid custom property: ${propertyName}`);
      return false;
    }

    this.setState(state => {
      const newCustomProperties = { ...state.customProperties };
      if (!newCustomProperties[elementId]) {
        newCustomProperties[elementId] = {};
      }
      newCustomProperties[elementId][propertyName] = value;
      return { ...state, customProperties: newCustomProperties };
    });
    return true;
  };

  model.getCustomProperty = function(elementId, propertyName) {
    const customProperties = this.getState(`customProperties.${elementId}`);
    return customProperties ? customProperties[propertyName] : undefined;
  };

  model.validateCustomProperty = function(propertyName, value) {
    if (typeof propertyName !== 'string' || propertyName.trim() === '') {
      return false;
    }

    // Add more specific validation rules based on your application's requirements
    if (propertyName === 'color' && (!Array.isArray(value) || value.length !== 3)) {
      return false;
    }

    return true;
  };

  model.addToHistory = function(action) {
    const undoAction = action();
    this.history.push(undoAction);
    this.undoneActions = []; // Clear redo stack when a new action is performed
  };

  model.undo = function() {
    if (this.history.length === 0) return;
    const undoAction = this.history.pop();
    const redoAction = undoAction();
    this.undoneActions.push(redoAction);
    this.notifyUpdate();
  };

  model.redo = function() {
    if (this.undoneActions.length === 0) return;
    const redoAction = this.undoneActions.pop();
    const undoAction = redoAction();
    this.history.push(undoAction);
    this.notifyUpdate();
  };

  // Placeholder for update notification
  model.notifyUpdate = function() {
    // This will be implemented in the provider
  };

  // Serialization methods
  model.toJSON = function() {
    return JSON.stringify({
      projectName: this.getState('projectName'),
      units: this.getState('units'),
      elements: this.getState('elements'),
      customProperties: this.getState('customProperties')
    });
  };

  model.fromJSON = function(json) {
    const data = JSON.parse(json);
    this.setState(() => ({
      projectName: data.projectName,
      units: data.units,
      elements: data.elements,
      customProperties: data.customProperties
    }));
  };

  return model;
};

export const HypeStudioProvider = ({ children }) => {
  const [model, setModel] = useState(() => createHypeStudioModel());

  const notifyUpdate = useCallback(() => {
    // Force a re-render without changing the model reference
    model.version = (model.version || 0) + 1;
    setModel(model);
  }, [model]);

  // Set notifyUpdate only once when the component mounts
  React.useEffect(() => {
    model.notifyUpdate = notifyUpdate;
  }, [model, notifyUpdate]);

  return (
    <HypeStudioContext.Provider value={model}>
      {children}
    </HypeStudioContext.Provider>
  );
};

export const useHypeStudioModel = () => {
  const context = useContext(HypeStudioContext);
  if (context === null) {
    throw new Error('useHypeStudioModel must be used within a HypeStudioProvider');
  }
  return context;
};
