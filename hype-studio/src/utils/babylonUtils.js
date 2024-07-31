// src/utils/babylonUtils.js

import { 
    Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, 
    StandardMaterial, Color3, Camera, Viewport, TransformNode
  } from '@babylonjs/core';
import * as meshUtils from './meshUtils';
  
  export const setupMainScene = (engine, canvas) => {
    const scene = new Scene(engine);
    scene.clearColor = new Color3(0.95, 0.95, 0.95);
  
    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
  
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
  
    return { scene, camera };
  };
  
  export const setupControlScene = (engine) => {
    const scene = new Scene(engine);
    scene.autoClear = false;
    scene.detachControl();
  
    const camera = new ArcRotateCamera("controlCamera", Math.PI / 4, Math.PI / 3, 10, Vector3.Zero(), scene);
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoTop = 1;
    camera.orthoBottom = -1;
    camera.orthoLeft = -1;
    camera.orthoRight = 1;
  
    const light = new HemisphericLight("controlLight", new Vector3(0, 1, 0), scene);
  
    scene.createDefaultCamera = false;
    scene.createDefaultLight = false;
    const viewport = new Viewport(0.75, 0.45, 0.25, 0.5);
    camera.viewport = viewport;
  
    return { scene, camera };
  };
  
  export const updateCameraControls = (camera, controlMode, canvas) => {
    camera.inputs.clear();
  
    switch (controlMode) {
      case 'zoom':
        camera.inputs.addMouseWheel();
        break;
      case 'pan':
        camera.inputs.addPointers();
        camera.panningSensibility = 50;
        break;
      case 'rotate':
      default:
        camera.inputs.addMouseWheel();
        camera.inputs.addPointers();
        break;
    }
  
    camera.attachControl(canvas, true);
  };
  
  export const createPlane = (scene, axis) => {
    const plane = MeshBuilder.CreatePlane(`${axis}Plane`, { size: 10 }, scene);
    const material = new StandardMaterial(`${axis}PlaneMaterial`, scene);
    material.diffuseColor = new Color3(0.5, 0.5, 0.5);
    material.alpha = 0.5;
    material.backFaceCulling = true;
    plane.material = material;
  
    switch(axis) {
      case 'X':
        plane.rotation.y = Math.PI / 2;
        break;
      case 'Y':
        plane.rotation.x = Math.PI / 2;
        break;
      default:
      case 'Z':
        // No rotation needed
        break;
    }
  
    return plane;
  };
  
  export const updatePlaneVisibility = (planes, planeStates, updateCameraForPlane) => {
    Object.entries(planeStates).forEach(([plane, state]) => {
      const planeMesh = planes[plane];
      if (planeMesh) {
        planeMesh.isVisible = state !== 'hidden';
        if (state === 'aligned') {
          updateCameraForPlane(plane);
        }
      }
    });
  };
  
  export const createPreviewMesh = (scene, type, startPoint) => {
    let mesh;
    if (type === 'circle') {
      mesh = MeshBuilder.CreateDisc('preview', { radius: 0.1 }, scene);
    } else if (type === 'rectangle') {
      mesh = MeshBuilder.CreatePlane('preview', { width: 0.1, height: 0.1 }, scene);
    }
    
    if (mesh) {
      mesh.position = startPoint;
      const material = new StandardMaterial("previewMaterial", scene);
      material.diffuseColor = new Color3(0, 1, 0);
      material.alpha = 0.5;
      mesh.material = material;
    }
    
    return mesh;
  };
  
  export const updatePreviewMesh = (mesh, startPoint, endPoint, type) => {
    if (type === 'circle') {
      const radius = Vector3.Distance(startPoint, endPoint);
      mesh.scaling = new Vector3(radius, radius, 1);
    } else if (type === 'rectangle') {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      mesh.scaling = new Vector3(width, height, 1);
      mesh.position = new Vector3(
        (startPoint.x + endPoint.x) / 2,
        (startPoint.y + endPoint.y) / 2,
        startPoint.z
      );
    }
  };
  
  export const getSketchDataFromPreview = (previewMesh, type) => {
    if (type === 'circle') {
      return {
        center: previewMesh.position,
        radius: previewMesh.scaling.x
      };
    } else if (type === 'rectangle') {
      return {
        center: previewMesh.position,
        width: previewMesh.scaling.x,
        height: previewMesh.scaling.y
      };
    }
  };

  export const handleMeshSelection = (pickResult, meshes, scene, model, onSelectionChange) => {
    if (pickResult.hit) {
      let pickedNode = pickResult.pickedMesh;
      while (pickedNode && !(pickedNode instanceof TransformNode)) {
        pickedNode = pickedNode.parent;
      }
      
      if (pickedNode) {
        const nodeId = pickedNode.id;
  
        // Clear previous selection
        if (model.selectedElementId && meshes[model.selectedElementId]) {
          meshUtils.unhighlightMesh(meshes[model.selectedElementId]);
        }
  
        // Set new selection
        model.selectElement(nodeId);
        meshUtils.highlightMesh(scene, pickedNode);
        
        onSelectionChange(nodeId);
  
        return nodeId;
      }
    } else {
      // Clear selection if clicking on empty space
      if (model.selectedElementId && meshes[model.selectedElementId]) {
        meshUtils.unhighlightMesh(meshes[model.selectedElementId]);
      }
      model.selectElement(null);
      onSelectionChange(null);
    }
    return null;
  };
  
  export const handleSketchInteraction = (model, sketchId, pickResult) => {
    const sketch = model.elements.sketches[sketchId];
    if (sketch) {
      const closestPointIndex = meshUtils.findClosestPointIndex(sketch.geometry, pickResult.pickedPoint);
      if (closestPointIndex !== -1) {
        return (dragPoint) => {
          const newGeometry = [...sketch.geometry];
          newGeometry[closestPointIndex] = {
            x: dragPoint.x,
            y: dragPoint.y
          };
          model.updateElement('sketches', sketchId, { geometry: newGeometry });
        };
      }
    }
    return null;
  };
  
  export const handleExtrusionInteraction = (model, extrusionId, pickResult) => {
    const extrusion = model.elements.extrusions[extrusionId];
    if (extrusion) {
      const startDepth = extrusion.depth;
      const startY = pickResult.pickedPoint.y;
  
      return (dragPoint) => {
        const depthChange = dragPoint.y - startY;
        const newDepth = Math.max(0, startDepth + depthChange);
        model.updateElement('extrusions', extrusionId, { depth: newDepth });
      };
    }
    return null;
  };
  
  export const updateCameraForPlane = (camera, plane) => {
    switch (plane) {
      case 'X':
        camera.setPosition(new Vector3(10, 0, 0));
        break;
      case 'Y':
        camera.setPosition(new Vector3(0, 10, 0));
        break;
      case 'Z':
        camera.setPosition(new Vector3(0, 0, 10));
        break;
    }
    camera.setTarget(Vector3.Zero());
  };

  export const renderScene = (scene, model, meshes) => {
    // Clear existing meshes
    Object.values(meshes).forEach(mesh => mesh.dispose());
    meshes = {};
  
    // Render sketches
    Object.values(model.elements.sketches).forEach(sketch => {
      const mesh = meshUtils.createSketchMesh(scene, sketch);
      meshes[sketch.id] = mesh;
    });
  
    // Render extrusions
    Object.values(model.elements.extrusions).forEach(extrusion => {
      const mesh = meshUtils.createExtrusionMesh(scene, extrusion, model.elements.sketches[extrusion.baseSketchId]);
      meshes[extrusion.id] = mesh;
    });
  
    // ... render other element types as needed
  
    return meshes;
  };