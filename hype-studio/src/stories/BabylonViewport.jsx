import React, { useEffect, useRef, useCallback, memo } from 'react';
import { HighlightLayer } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { createControlCube, getViewFromNormal } from '../utils/sceneUtils';
import {
  setupMainScene,
  setupControlScene,
  updateCameraControls,
  createPlane,
  updatePlaneVisibility,
  createPreviewMesh,
  updatePreviewMesh,
  getSketchDataFromPreview,
  handleMeshSelection,
  handleSketchInteraction,
  handleExtrusionInteraction,
  updateCameraForPlane,
  updateCameraPosition,
  renderScene
} from '../utils/babylonUtils';
import { usePointerEvents } from '../hooks/usePointerEvents';

export const BabylonViewport = memo(({ engine, canvas }) => {
  const modelRef = useRef(useHypeStudioModel());
  const activeView = useHypeStudioState('activeView', 'List View');
  const selectedSketchType = useHypeStudioState('selectedSketchType', null);

  const sceneRef = useRef(null);
  const controlSceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef({});
  const planesRef = useRef({});
  const highlightLayerRef = useRef(null);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const previewMeshRef = useRef(null);
  const currentViewRef = useRef('Front');

  useEffect(() => {
    if (!engine || !canvas || !engine.isEngineActive) return;

    // Main scene setup
    const { scene, camera } = setupMainScene(engine, canvas);
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

    modelRef.current.setState(state => ({ ...state, currentModelView: currentViewRef.current }));

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

    const renderSubscription = modelRef.current.subscribe('', () => {
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
        renderSubscription.unsubscribe();
        currentModelViewSubscription.unsubscribe();
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

    const scene = sceneRef.current;

    if (activeView === 'Sketch View' && selectedSketchType && pickResult.hit && pickResult.pickedMesh.name.includes('Plane')) {
      isDrawingRef.current = true;
      startPointRef.current = pickResult.pickedPoint;
      previewMeshRef.current = createPreviewMesh(scene, selectedSketchType, pickResult.pickedPoint);
    } else {
      const selectedNodeId = handleMeshSelection(pickResult, meshesRef.current, scene, modelRef.current, (nodeId) => {
        // This is where you would call your onSelectionChange function if needed
      });

      if (selectedNodeId) {
        const elementType = selectedNodeId.split('_')[0];
        let dragCallback;
        switch (elementType) {
          default:
          case 'sketch':
            dragCallback = handleSketchInteraction(modelRef.current, selectedNodeId, pickResult);
            break;
          case 'extrusion':
            dragCallback = handleExtrusionInteraction(modelRef.current, selectedNodeId, pickResult);
            break;
          // Add cases for other element types
        }
        if (dragCallback) {
          scene.onPointerMove = (moveEvt) => {
            const dragResult = scene.pick(moveEvt.offsetX, moveEvt.offsetY);
            if (dragResult.hit) {
              dragCallback(dragResult.pickedPoint);
            }
          };
          scene.onPointerUp = () => {
            scene.onPointerMove = null;
            scene.onPointerUp = null;
          };
        }
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
  }, [selectedSketchType]);

  usePointerEvents(sceneRef, handlePointerDown, handlePointerMove, handlePointerUp);

  return null;
});