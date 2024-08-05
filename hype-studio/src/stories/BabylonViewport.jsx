import { useEffect, useRef, useCallback, memo } from 'react';
import { HighlightLayer, Vector3, VertexBuffer, MeshBuilder, Color3, ShaderMaterial } from '@babylonjs/core';
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

            // Extract positions, indices, and normals from the mesh
            const positions = newMesh.getVerticesData(VertexBuffer.PositionKind);
            const indices = newMesh.getIndices();
            const normals = newMesh.getVerticesData(VertexBuffer.NormalKind);
            const adjacencyList = shapeData.adjacencyList;

            const linesDataMap = new Map();
            const normalGroups = {};
            const threshold = 0.1; // Adjust the threshold as needed

            // Function to group normals by axis components within a threshold
            function groupNormals(normal) {
              const key = `${Math.round(normal.x / threshold) * threshold},${Math.round(normal.y / threshold) * threshold},${Math.round(normal.z / threshold) * threshold}`;
              if (!normalGroups[key]) {
                  normalGroups[key] = [];
              }
              normalGroups[key].push(normal);
              return key;
          }

          // Loop through indices and group lines by their normals
          for (let i = 0; i < indices.length; i += 3) {
              const v1 = new Vector3(
                  positions[indices[i] * 3], 
                  positions[indices[i] * 3 + 1], 
                  positions[indices[i] * 3 + 2]
              );
              const v2 = new Vector3(
                  positions[indices[i + 1] * 3], 
                  positions[indices[i + 1] * 3 + 1], 
                  positions[indices[i + 1] * 3 + 2]
              );
              const v3 = new Vector3(
                  positions[indices[i + 2] * 3], 
                  positions[indices[i + 2] * 3 + 1], 
                  positions[indices[i + 2] * 3 + 2]
              );

              const n1 = new Vector3(
                  normals[indices[i] * 3], 
                  normals[indices[i] * 3 + 1], 
                  normals[indices[i] * 3 + 2]
              );
              const n2 = new Vector3(
                  normals[indices[i + 1] * 3], 
                  normals[indices[i + 1] * 3 + 1], 
                  normals[indices[i + 1] * 3 + 2]
              );
              const n3 = new Vector3(
                  normals[indices[i + 2] * 3], 
                  normals[indices[i + 2] * 3 + 1], 
                  normals[indices[i + 2] * 3 + 2]
              );

              const key1 = groupNormals(n1);
              const key2 = groupNormals(n2);
              const key3 = groupNormals(n3);

              if (!linesDataMap.has(key1)) linesDataMap.set(key1, []);
              if (!linesDataMap.has(key2)) linesDataMap.set(key2, []);
              if (!linesDataMap.has(key3)) linesDataMap.set(key3, []);

              linesDataMap.get(key1).push([v1, v2], [v2, v3], [v3, v1]);
          }

            // Calculate average normals for each group
            const averageNormals = {};
            for (const [key, normals] of Object.entries(normalGroups)) {
                const sum = normals.reduce((acc, normal) => acc.addInPlace(normal), new Vector3(0, 0, 0));
                const averageNormal = sum.scale(1 / normals.length);
                averageNormals[key] = averageNormal;
            }

            // Find ordered pairs of group keys
            const groupPairs = [];
            const groupKeys = Object.keys(normalGroups);
            for (let i = 0; i < groupKeys.length; i++) {
                for (let j = i + 1; j < groupKeys.length; j++) {
                    groupPairs.push([groupKeys[i], groupKeys[j]]);
                }
            }

            // Create a map from normal vector to its index in the 'normals' array
            const normalToIndexMap = new Map();
            for (let i = 0; i < normals.length; i += 3) {
                const normal = new Vector3(normals[i], normals[i + 1], normals[i + 2]);
                normalToIndexMap.set(normal.toString(), i / 3); // Use string representation of Vector3 as key
            }

            // Check for shared vertices and compare average normals
            const groupsToMerge = new Map();
            const positionThresholdSquared = threshold * 20; // Square the threshold for distance comparison
            const areNormalsSimilar = (normal1, normal2) => Vector3.DistanceSquared(normal1, normal2) < threshold * threshold;

            for (const [groupKey1, groupKey2] of groupPairs) {
                const verticesGroup1 = normalGroups[groupKey1].map(normal => {
                    const vertexIndex = normalToIndexMap.get(normal.toString());
                    return new Vector3(positions[vertexIndex * 3], positions[vertexIndex * 3 + 1], positions[vertexIndex * 3 + 2]);
                });

                for (const normal of normalGroups[groupKey2]) {
                    const vertexIndex = normalToIndexMap.get(normal.toString());
                    const v2 = new Vector3(
                        positions[vertexIndex * 3],
                        positions[vertexIndex * 3 + 1],
                        positions[vertexIndex * 3 + 2]
                    );

                    for (const v1 of verticesGroup1) {
                        if (Vector3.DistanceSquared(v1, v2) < positionThresholdSquared) {
                            // Vertices are close enough, groups share a vertex
                            if (areNormalsSimilar(averageNormals[groupKey1], averageNormals[groupKey2])) {
                                if (!groupsToMerge.has(groupKey1)) groupsToMerge.set(groupKey1, new Set());
                                groupsToMerge.get(groupKey1).add(groupKey2);
                            }
                            break; // No need to check other vertices in group1 if one is already shared
                        }
                    }
                }
            }

            // Merge groups
            const mergedGroups = new Map();
            const visitedGroups = new Set();

            for (const [groupKey, mergeSet] of groupsToMerge.entries()) {
                if (!visitedGroups.has(groupKey)) {
                    const mergedSet = new Set();
                    const queue = [groupKey];

                    while (queue.length > 0) {
                        const currentKey = queue.shift();
                        if (visitedGroups.has(currentKey)) continue;

                        visitedGroups.add(currentKey);
                        mergedSet.add(currentKey);

                        if (groupsToMerge.has(currentKey)) {
                            for (const adjacentKey of groupsToMerge.get(currentKey)) {
                                if (!visitedGroups.has(adjacentKey)) {
                                    queue.push(adjacentKey);
                                }
                            }
                        }
                    }

                    // Add merged set to mergedGroups and remove all keys in mergedSet from mergedGroups
                    mergedSet.delete(groupKey);
                    mergedGroups.set(groupKey, mergedSet);
                    // mergedSet.forEach(key => mergedGroups.delete(key));
                }
            }

            // Function to generate random colors
            function getRandomColor() {
                return new Color3(Math.random(), Math.random(), Math.random());
            }

            // Create separate line systems for each merged group
            let index = 0;
            for (const [groupKey, groupSet] of mergedGroups.entries()) {
                const linesData = [];

                if (linesDataMap.has(groupKey)) {
                  linesData.push(...linesDataMap.get(groupKey));
                }

                // Gather lines for the current group and merged groups
                for (const key of groupSet) {
                    if (linesDataMap.has(key)) {
                        linesData.push(...linesDataMap.get(key));
                    }
                }

                // Create line system for the merged group
                if (linesData.length > 0) {
                    const lineSystem = MeshBuilder.CreateLineSystem(`lines_${index}`, { lines: linesData }, sceneRef.current);
                    lineSystem.color = getRandomColor();
                    lineSystem.renderingGroupId = 1;
                    index++;
                }
            }

            // // Create separate line systems for each normal group
            // let index = 0;
            // linesDataMap.forEach((linesData, key) => {
            //     const lineSystem = MeshBuilder.CreateLineSystem(`lines_${index}`, { lines: linesData }, sceneRef.current);
            //     lineSystem.color = getRandomColor();
            //     lineSystem.renderingGroupId = 1;
            //     index++;
            // });

            // const linesData = [];
            // for (let i = 0; i < indices.length; i += 3) {
            //     const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
            //     const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
            //     const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

            //     linesData.push([v1, v2], [v2, v3], [v3, v1]); // Connect all three vertices of the triangle
            // }

            // const outline = MeshBuilder.CreateLineSystem("lines", { lines: linesData }, sceneRef.current);
            // outline.color = new Color3(0, 1, 0);
            // outline.renderingGroupId = 1;

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
  
      // if (mesh.shape === 'cylinder') {
      //   selection = selectCylinderPart(mesh, pickResult);
      //   if (selection) {
      //     highlightedMeshRef.current = highlightCylinderPart(mesh, selection);
      //   }
      // } else {
        // First, try to select a specific edge
      //   const edgeIndex = selectEdge(mesh, pickResult);
      //   if (edgeIndex !== -1) {
      //     selection = { type: 'edge', data: edgeIndex };
      //     highlightedMeshRef.current = highlightEdge(mesh, edgeIndex);
      //   } else {
      //     // If no edge is selected, try to select a face
      //     const faceIndex = selectFace(mesh, pickResult);
      //     if (faceIndex !== -1) {
      //       selection = { type: 'face', data: faceIndex };
      //       highlightedMeshRef.current = highlightFace(mesh, faceIndex);
      //     } else {
      //       // If no specific part is selected, fall back to general mesh part selection
      //       selection = selectMeshPart(mesh, pickResult, modelRef.current.getAdjacencyList(mesh));
      //       if (selection) {
      //         highlightedMeshRef.current = highlightMeshPart(mesh, selection);
      //       }
      //     }
      //   }
      // }

      selection = selectMeshPart(mesh, pickResult, modelRef.current.getAdjacencyList(mesh));
      if (selection) {
        highlightedMeshRef.current = highlightMeshPart(mesh, selection);
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