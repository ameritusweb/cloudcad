import React, { createContext, useContext, useState, useCallback } from 'react';

const HypeStudioContext = createContext(null);

const createHypeStudioModel = () => ({
  projectName: 'Untitled Project',
  units: 'mm',
  elements: {
    sketches: {},
    extrusions: {},
    // Add other element types as needed
  },
  customProperties: {},
  selectedElementId: null,
  history: [],
  undoneActions: [],

  setProjectName(name) {
    this.addToHistory(() => {
      const oldName = this.projectName;
      this.projectName = name;
      return () => { this.projectName = oldName; };
    });
    this.notifyUpdate();
  },

  addElement(type, element) {
    const id = `${type}_${Date.now()}`;
    this.addToHistory(() => {
      this.elements[type][id] = { ...element, id };
      return () => { delete this.elements[type][id]; };
    });
    this.notifyUpdate();
    return id;
  },

  updateElement(type, id, updates) {
    if (!this.elements[type][id]) {
      console.error(`Element not found: ${type} ${id}`);
      return;
    }
    this.addToHistory(() => {
      const oldElement = { ...this.elements[type][id] };
      this.elements[type][id] = { ...oldElement, ...updates };
      return () => { this.elements[type][id] = oldElement; };
    });
    this.notifyUpdate();
  },

  deleteElement(type, id) {
    if (!this.elements[type][id]) {
      console.error(`Element not found: ${type} ${id}`);
      return;
    }
    this.addToHistory(() => {
      const deletedElement = this.elements[type][id];
      delete this.elements[type][id];
      return () => { this.elements[type][id] = deletedElement; };
    });
    this.notifyUpdate();
  },

  selectElement(elementId) {
    this.selectedElementId = elementId;
    this.notifyUpdate();
  },

  setCustomProperty(elementId, propertyName, value) {
    if (!this.validateCustomProperty(propertyName, value)) {
      console.error(`Invalid custom property: ${propertyName}`);
      return false;
    }

    this.addToHistory(() => {
      const oldValue = this.customProperties[elementId]?.[propertyName];
      if (!this.customProperties[elementId]) {
        this.customProperties[elementId] = {};
      }
      this.customProperties[elementId][propertyName] = value;
      return () => {
        if (oldValue === undefined) {
          delete this.customProperties[elementId][propertyName];
        } else {
          this.customProperties[elementId][propertyName] = oldValue;
        }
      };
    });
    this.notifyUpdate();
    return true;
  },

  getCustomProperty(elementId, propertyName) {
    return this.customProperties[elementId]?.[propertyName];
  },

  validateCustomProperty(propertyName, value) {
    if (typeof propertyName !== 'string' || propertyName.trim() === '') {
      return false;
    }

    // Add more specific validation rules based on your application's requirements
    // For example:
    if (propertyName === 'color' && (!Array.isArray(value) || value.length !== 3)) {
      return false;
    }

    return true;
  },

  addToHistory(action) {
    const undoAction = action();
    this.history.push(undoAction);
    this.undoneActions = []; // Clear redo stack when a new action is performed
  },

  undo() {
    if (this.history.length === 0) return;
    const undoAction = this.history.pop();
    const redoAction = undoAction();
    this.undoneActions.push(redoAction);
    this.notifyUpdate();
  },

  redo() {
    if (this.undoneActions.length === 0) return;
    const redoAction = this.undoneActions.pop();
    const undoAction = redoAction();
    this.history.push(undoAction);
    this.notifyUpdate();
  },

  // Placeholder for update notification
  notifyUpdate() {
    // This will be implemented in the provider
  },

  // Serialization methods
  toJSON() {
    return JSON.stringify({
      projectName: this.projectName,
      units: this.units,
      elements: this.elements,
      customProperties: this.customProperties
    });
  },

  fromJSON(json) {
    const data = JSON.parse(json);
    this.projectName = data.projectName;
    this.units = data.units;
    this.elements = data.elements;
    this.customProperties = data.customProperties;
    this.history = [];
    this.undoneActions = [];
    this.notifyUpdate();
  }
});

export const HypeStudioProvider = ({ children }) => {
  const [model, setModel] = useState(() => createHypeStudioModel());

  const notifyUpdate = useCallback(() => {
    setModel(prevModel => ({ ...prevModel }));
  }, []);

  model.notifyUpdate = notifyUpdate;

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
