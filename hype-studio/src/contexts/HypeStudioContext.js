import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import EnhancedZenObservable from '../observables/EnhancedZenObservable';
import { MeshBuilder, Vector3, VertexBuffer, Mesh, NullEngine, Scene, Engine } from '@babylonjs/core';
import { calculateSurfaceArea, applyPreciseTessellation } from '../utils/tesselationUtils';
import { exportStateToJSON, importStateFromJSON } from '../utils/ioUtils';
import { saveStateToLocalStorage, loadStateFromLocalStorage, clearStateFromLocalStorage } from '../utils/storageUtils';
import { Notification } from '../stories/Notification';
import { useNotification } from '../hooks/useNotification';

const initialHypeStudioState = {
  projectName: 'My Project',
  dimensions: '20mm x 40mm x 20mm',
  units: 'mm',
  elements: {
    sketches: {},
    extrusions: {},
    shapes: {}
    // Add other element types as needed
  },
  camera: {
    position: null,
    target: null
  },
  customProperties: {},
  selectedElementId: null,
  selectedElement: null,
  selectedPart: null,
  activeView: 'List View',
  leftPanelContent: [],
  currentModelView: '',
  controlMode: 'rotate',
  customPlanes: [],
  planeStates: {
    X: 'hidden',
    Y: 'hidden',
    Z: 'hidden'
  },
  selectedSketchType: null,
  autosaveInterval: 30000,
  stateVersion: '1.0.0',
};

const HypeStudioContext = createContext(null);

const createHypeStudioModel = () => {
  const model = new EnhancedZenObservable(initialHypeStudioState);

  model.getStateVersion = function() {
    return this.getState().stateVersion;
  };

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
      return { 
        ...state, 
        elements: newElements,
        selectedElementId: id // Automatically select the new element
      };
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

  model.updateShapeComplexity = function(id, complexity) {
    this.updateElement('shapes', id, { complexity: Math.max(1, Math.min(10, complexity)) });
  };

  model.updateShapeDimensions = function(id, dimensions) {
    this.updateElement('shapes', id, { params: dimensions });
  };

  model.createShape = function(shapeData) {
    const id = this.addElement('shapes', shapeData);
    return id;
  };

  model.createTessellatedShape = function(tempScene, shapeData) {
    const { type, params, triangleDensityTarget, estimatedTriangles } = shapeData;
    
    // Create a basic shape mesh
    const mesh = type === 'box' 
      ? MeshBuilder.CreateBox("box", params, tempScene)
      : MeshBuilder.CreateCylinder("cylinder", params, tempScene);
  
    // Apply precise tessellation
    const tessellatedMesh = applyPreciseTessellation(mesh, triangleDensityTarget, estimatedTriangles);

    // Extract geometry data
    const positions = tessellatedMesh.getVerticesData(VertexBuffer.PositionKind);
    const indices = tessellatedMesh.getIndices();
    const normals = tessellatedMesh.getVerticesData(VertexBuffer.NormalKind);
    const uvs = tessellatedMesh.getVerticesData(VertexBuffer.UVKind);

    // Calculate actual surface area and triangle count
    const surfaceArea = calculateSurfaceArea(tessellatedMesh);
    const actualTriangles = indices.length / 3;
    const actualDensity = actualTriangles / surfaceArea;
  
    // Add to the scene and state
    const id = `shape_${Date.now()}`;
    
    // Create the shape object to be stored in state
    const shapeObject = {
      id,
      type,
      params,
      triangleDensityTarget,
      estimatedTriangles,
      actualTriangles,
      actualDensity,
      surfaceArea,
      geometry: {
        positions: Array.from(positions),
        indices: Array.from(indices),
        normals: Array.from(normals),
        uvs: uvs ? Array.from(uvs) : null,
      },
      transform: {
        position: tessellatedMesh.position.asArray(),
        rotation: tessellatedMesh.rotation.asArray(),
        scaling: tessellatedMesh.scaling.asArray(),
      }
    };

    // Add to the application state
    this.setState(state => ({
      ...state,
      elements: {
        ...state.elements,
        shapes: {
          ...state.elements.shapes,
          [id]: shapeObject
        }
      }
    }));
    
    return id;
  };

  model.reconstructMeshFromState = function(shapeId) {
    const shapeData = this.state.elements.shapes[shapeId];
    if (!shapeData) return null;
  
    const mesh = new Mesh(shapeData.id, this.scene);
    
    const positions = new Float32Array(shapeData.geometry.positions);
    const indices = new Uint32Array(shapeData.geometry.indices);
    const normals = new Float32Array(shapeData.geometry.normals);
    
    mesh.setVerticesData(VertexBuffer.PositionKind, positions);
    mesh.setIndices(indices);
    mesh.setVerticesData(VertexBuffer.NormalKind, normals);
    
    if (shapeData.geometry.uvs) {
      const uvs = new Float32Array(shapeData.geometry.uvs);
      mesh.setVerticesData(VertexBuffer.UVKind, uvs);
    }
  
    mesh.position = Vector3.FromArray(shapeData.transform.position);
    mesh.rotation = Vector3.FromArray(shapeData.transform.rotation);
    mesh.scaling = Vector3.FromArray(shapeData.transform.scaling);
  
    return mesh;
  };

  model.loadStateAndReconstructMeshes = function(savedState) {
    this.setState(savedState);
    
    Object.keys(savedState.elements.shapes).forEach(shapeId => {
      const mesh = this.reconstructMeshFromState(shapeId);
      if (mesh) {
        this.scene.addMesh(mesh);
      }
    });
  };

  model.deleteCustomPlane = function(planeId) {
    this.setState(state => ({
      ...state,
      customPlanes: state.customPlanes.filter(plane => plane.id !== planeId),
      planeStates: Object.fromEntries(
        Object.entries(state.planeStates).filter(([key]) => key !== planeId)
      ),
    }));
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
    this.setState(state => ({ 
      ...state, 
      selectedElementId: elementId,
      selectedSketchType: null // Reset selected sketch type when selecting an element
    }));
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

  // Placeholder for update notification
  model.notifyUpdate = function() {
    // This will be implemented in the provider
  };

  model.exportState = () => {
    exportStateToJSON(model);
  };

  model.importState = (file) => {
    importStateFromJSON(file, model);
  };

  model.saveState = () => {
    saveStateToLocalStorage(model.getState());
  };

  model.loadState = () => {
    const savedState = loadStateFromLocalStorage();
    if (savedState) {
      model.setState(() => savedState, false);
    }
  };

  model.clearState = () => {
    clearStateFromLocalStorage();
  };

  model.setAutosaveInterval = (interval) => {
    model.setState(state => ({ ...state, autosaveInterval: interval }));
  };

  let autosaveRef = null;

  model.startAutosave = () => {
    if (autosaveRef) {
      clearInterval(autosaveRef);
    }
    autosaveRef = setInterval(() => {
      model.saveState();
    }, model.getState('autosaveInterval'));
  };

  model.stopAutosave = () => {
    if (autosaveRef) {
      clearInterval(autosaveRef);
      autosaveRef = null;
    }
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

  const [model, setModel] = useState(() => {
    const model = createHypeStudioModel();
    // model.loadState(); // Load state from localStorage on initialization
    return model;
  });

  const { notifications, addNotification } = useNotification();

  useEffect(() => {
    // Create temp engine and scene for offscreen operations
    const canvas = document.createElement('canvas'); 
    const newTempEngine = new Engine(canvas, true);
    const newTempScene = new Scene(newTempEngine);
    model.tempEngine = newTempEngine;
    model.tempScene = newTempScene;

    return () => {
      newTempEngine.dispose();
      newTempScene.dispose();
    };
  }, []);

  useEffect(() => {
    model.setStateProperty = (propertyName, value, recordHistory = true) => {
      model.setState((prevModel) => ({ ...prevModel, [propertyName]: value }), recordHistory);
    }

    model.addNotification = (type, message) => {
      addNotification(type, message);
    }

    model.notifyUpdate = () => {
      model.version = (model.version || 0) + 1;
      setModel(model);
    };
  }, [model]);

  useEffect(() => {
    model.startAutosave(); // Start autosave when component mounts

    return () => {
      model.stopAutosave(); // Clean up autosave when component unmounts
    };
  }, [model]);

  useEffect(() => {
    model.startAutosave(); // Restart autosave when autosave interval changes
  }, [model]);

  return (
    <HypeStudioContext.Provider value={model}>
      {children}
      <Notification notifications={notifications} />
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

export const useAutosaveControl = () => {
  const context = useContext(HypeStudioContext);
  if (context === null) {
    throw new Error('useAutosaveControl must be used within a HypeStudioProvider');
  }
  return { startAutosave: context.startAutosave, stopAutosave: context.stopAutosave };
};

export const useNotificationControl = () => {
  const context = useContext(HypeStudioContext);
  if (context === null) {
    throw new Error('useNotificationControl must be used within a HypeStudioProvider');
  }
  return { addNotification: context.addNotification, removeNotification: context.removeNotification };
};

export const useHypeStudioEngines = () => {
  const context = useContext(HypeStudioContext);
  if (!context) {
    throw new Error('useHypeStudioEngines must be used within a HypeStudioProvider');
  }
  return {
    getTempEngine: () => context.tempEngine,
    getTempScene: () => context.tempScene
  };
};