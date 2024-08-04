import { useEffect, useRef, useCallback, memo } from 'react';
import { HighlightLayer, Vector3 } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { createControlCube, getViewFromNormal } from '../utils/sceneUtils';
import {
  setupMainScene,
  setupControlScene,
  createPlane,
  updatePlaneVisibility,
  createPreviewMesh,
  updatePreviewMesh,
  getSketchDataFromPreview,
  handleMeshSelection,
  handleSketchInteraction,
  handleExtrusionInteraction,
  renderScene,
  createShape,
  updateShape,
  removeShape
} from '../utils/babylonUtils';
import {
  updateCameraControls,
  updateCameraForPlane,
  updateCameraPosition
} from '../utils/cameraUtils';
import { usePointerEvents } from '../hooks/usePointerEvents';
import {
  selectEdge,
  selectFace,
  highlightEdge,
  highlightFace,
  selectCylinderPart,
  highlightCylinderPart,
  selectMeshPart,
  highlightMeshPart
} from '../utils/selectionUtils';

export const BabylonViewport = memo(({ engine, canvas }) => {
  const modelRef = useRef(useHypeStudioModel());
  const activeView = useHypeStudioState('activeView', 'List View');
  const selectedSketchType = useHypeStudioState('selectedSketchType', null);

  const sceneRef = useRef(null);
  const controlSceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef({});
  const planesRef = useRef({});
  const shapesRef = useRef({});

  const shapes = useHypeStudioState('elements.shapes', {});

  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const previewMeshRef = useRef(null);
  const currentViewRef = useRef('Front');

  const highlightLayerRef = useRef(null);
  const highlightedMeshRef = useRef(null);

  useEffect(() => {
    if (!engine || !canvas || !engine.isEngineActive) return;

    // Main scene setup
    const { scene, camera } = setupMainScene(engine, canvas, meshesRef);
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Control scene setup
    const { scene: controlScene } = setupControlScene(engine, canvas);
    controlSceneRef.current = controlScene;

    createControlCube(controlScene, (normal) => {
      const newView = getViewFromNormal(normal);
      currentViewRef.current = newView;
      modelRef.current.setState(state => ({ ...state, currentModelView: newView }));
    });

    modelRef.current.setState(state => ({ ...state, currentModelView: currentViewRef.current }), false);

    highlightLayerRef.current = new HighlightLayer("highlightLayer", scene);

    // Plane setup
    planesRef.current = {
      X: createPlane(scene, 'X'),
      Y: createPlane(scene, 'Y'),
      Z: createPlane(scene, 'Z')
    };

    // Subscriptions
    const controlModeSubscription = modelRef.current.subscribe('controlMode', (newControlMode) => 
      updateCameraControls(camera, newControlMode, canvas)
    );

    const planeStatesSubscription = modelRef.current.subscribe('planeStates', (newPlaneStates) => 
      updatePlaneVisibility(planesRef.current, newPlaneStates, (plane) => updateCameraForPlane(camera, plane))
    );

    const currentModelViewSubscription = modelRef.current.subscribe('currentModelView', (newCurrentModelView) => {
      currentViewRef.current = newCurrentModelView;
      updateCameraPosition(cameraRef.current, newCurrentModelView);
    });

    const customPlanesSubscription = modelRef.current.subscribe('customPlanes', (newCustomPlanes) => {
      newCustomPlanes.forEach(plane => {
        if (!planesRef.current[plane.id]) {
          planesRef.current[plane.id] = createPlane(sceneRef.current, plane.id, new Vector3(plane.normal.x, plane.normal.y, plane.normal.z));
        }
      });
      
      // Remove any planes that no longer exist
      Object.keys(planesRef.current).forEach(planeId => {
        if (!['X', 'Y', 'Z'].includes(planeId) && !newCustomPlanes.find(p => p.id === planeId)) {
          planesRef.current[planeId].dispose();
          delete planesRef.current[planeId];
        }
      });
    });

    const shapesSubscription = modelRef.current.subscribe('elements.shapes', (newShapes) => {
      // Handle added or updated shapes
      Object.entries(newShapes).forEach(([id, shapeData]) => {
        if (!shapesRef.current[id]) {
          // New shape
          const newMesh = createShape(sceneRef.current, id, shapeData);
          if (newMesh) {
            shapesRef.current[id] = newMesh;
          }
        } else {
          // Updated shape
          updateShape(shapesRef.current[id], shapeData);
        }
      });

      // Handle removed shapes
      Object.keys(shapesRef.current).forEach((id) => {
        if (!newShapes[id]) {
          removeShape(sceneRef.current, shapesRef.current[id]);
          delete shapesRef.current[id];
        }
      });
    });

    const renderSubscription = modelRef.current.subscribe('elements', () => {
      meshesRef.current = renderScene(scene, modelRef.current, meshesRef.current);
    });
  
    engine.runRenderLoop(() => {
      sceneRef.current.render();
      controlSceneRef.current.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      if (engine.isEngineActive) {
        controlModeSubscription.unsubscribe();
        planeStatesSubscription.unsubscribe();
        customPlanesSubscription.unsubscribe();
        shapesSubscription.unsubscribe();
        renderSubscription.unsubscribe();
        currentModelViewSubscription.unsubscribe();

        if (highlightedMeshRef.current) {
          highlightLayerRef.current.removeMesh(highlightedMeshRef.current);
          highlightedMeshRef.current.dispose();
        }
        highlightLayerRef.current.dispose();
        
        window.removeEventListener("resize", engine.resize);
        scene.dispose();
        controlScene.dispose();
      }
    };
  }, [engine, canvas]);

  const handlePointerDown = useCallback((evt, pickResult) => {
    if (evt.button === 2) {
      evt.preventDefault();
      return;
    }

    const controlMode = modelRef.current.state.controlMode;
    if (controlMode === 'rotate' || controlMode === 'pan' || controlMode === 'zoom') {
      return;
    }

    const scene = sceneRef.current;

    // Clear selection when clicking on empty space
  if (!pickResult.hit) {
    if (highlightedMeshRef.current) {
      highlightLayerRef.current.removeMesh(highlightedMeshRef.current);
      highlightedMeshRef.current.dispose();
      highlightedMeshRef.current = null;
    }
    modelRef.current.setState(state => ({
      ...state,
      selectedPart: null,
      selectedElementId: null
    }));
    return;
  }

    if (activeView === 'Sketch View' && selectedSketchType && pickResult.hit && pickResult.pickedMesh.name.includes('Plane')) {
      isDrawingRef.current = true;
      startPointRef.current = pickResult.pickedPoint;
      previewMeshRef.current = createPreviewMesh(scene, selectedSketchType, pickResult.pickedPoint);
    } else if (pickResult.hit) {
      const mesh = pickResult.pickedMesh;
      let selection;
  
      // Clear previous highlight
      if (highlightedMeshRef.current) {
        highlightLayerRef.current.removeMesh(highlightedMeshRef.current);
        highlightedMeshRef.current.dispose();
        highlightedMeshRef.current = null;
      }
  
      if (mesh.shape === 'cylinder') {
        selection = selectCylinderPart(mesh, pickResult);
        if (selection) {
          highlightedMeshRef.current = highlightCylinderPart(mesh, selection);
        }
      } else {
        // First, try to select a specific edge
        const edgeIndex = selectEdge(mesh, pickResult);
        if (edgeIndex !== -1) {
          selection = { type: 'edge', data: edgeIndex };
          highlightedMeshRef.current = highlightEdge(mesh, edgeIndex);
        } else {
          // If no edge is selected, try to select a face
          const faceIndex = selectFace(mesh, pickResult);
          if (faceIndex !== -1) {
            selection = { type: 'face', data: faceIndex };
            highlightedMeshRef.current = highlightFace(mesh, faceIndex);
          } else {
            // If no specific part is selected, fall back to general mesh part selection
            selection = selectMeshPart(mesh, pickResult);
            if (selection) {
              highlightedMeshRef.current = highlightMeshPart(mesh, selection);
            }
          }
        }
      }
  
      if (highlightedMeshRef.current) {
        highlightLayerRef.current.addMesh(highlightedMeshRef.current, new Vector3(1, 1, 0));
      }
  
      if (selection) {
        modelRef.current.setState(state => ({
          ...state,
          selectedPart: {
            meshId: mesh.id,
            ...selection
          }
        }));
  
        // // Handle mesh selection and interaction as before
        // const selectedNodeId = handleMeshSelection(pickResult, meshesRef.current, scene, modelRef.current, (nodeId) => {
        //   // This is where you would call your onSelectionChange function if needed
        // });
  
        // if (selectedNodeId) {
        //   const elementType = selectedNodeId.split('_')[0];
        //   let dragCallback;
        //   switch (elementType) {
        //     case 'sketch':
        //       dragCallback = handleSketchInteraction(modelRef.current, selectedNodeId, pickResult);
        //       break;
        //     case 'extrusion':
        //       dragCallback = handleExtrusionInteraction(modelRef.current, selectedNodeId, pickResult);
        //       break;
        //     // Add cases for other element types
        //   }
        //   if (dragCallback) {
        //     scene.onPointerMove = (moveEvt) => {
        //       const dragResult = scene.pick(moveEvt.offsetX, moveEvt.offsetY);
        //       if (dragResult.hit) {
        //         dragCallback(dragResult.pickedPoint);
        //       }
        //     };
        //     scene.onPointerUp = () => {
        //       scene.onPointerMove = null;
        //       scene.onPointerUp = null;
        //     };
        //   }
        // }
      }
    }
  }, [activeView, selectedSketchType]);

  const handlePointerMove = useCallback((evt, pickResult) => {
    if (isDrawingRef.current && previewMeshRef.current) {
      if (pickResult.hit) {
        updatePreviewMesh(previewMeshRef.current, startPointRef.current, pickResult.pickedPoint, selectedSketchType);
      }
    }
  }, [selectedSketchType]);

  const handlePointerUp = useCallback(() => {
    if (isDrawingRef.current && previewMeshRef.current) {
      isDrawingRef.current = false;
      const sketchData = getSketchDataFromPreview(previewMeshRef.current, selectedSketchType);
      modelRef.current.createSketch({ type: selectedSketchType, ...sketchData });
      previewMeshRef.current.dispose();
      previewMeshRef.current = null;
    }

    if (cameraRef.current) {
      modelRef.current.setState(state => ({
        ...state,
        camera: {
          position: {
            x: cameraRef.current.position.x,
            y: cameraRef.current.position.y,
            z: cameraRef.current.position.z
          },
          target: {
            x: cameraRef.current.target.x,
            y: cameraRef.current.target.y,
            z: cameraRef.current.target.z
          }}
        }
      ), false);
    }
  }, [selectedSketchType]);

  usePointerEvents(sceneRef, handlePointerDown, handlePointerMove, handlePointerUp);

  return null;
});