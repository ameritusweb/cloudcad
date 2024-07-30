import React, { useEffect, useRef, useState, useCallback, memo, useImperativeHandle, forwardRef } from 'react';
import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, UtilityLayerRenderer, ExecuteCodeAction, DynamicTexture,
  StandardMaterial, Color3, Camera, TransformNode, ActionManager, HighlightLayer, Matrix, RenderTargetTexture, Viewport, Mesh
} from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import * as meshUtils from '../utils/meshUtils';

const PlaneState = {
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  ALIGNED: 'aligned'
};

export const BabylonViewport = memo(forwardRef(({
  canvas, 
  engine, 
  onViewChange, 
  onSelectionChange, 
  controlMode,
  planeStates,
  activeView,
  selectedSketchType,
  onSketchCreate
}, ref) => {
  const engineRef = useRef(engine);
  const canvasRef = useRef(canvas);
  const sceneRef = useRef(null);
  const controlSceneRef = useRef(null);
  const boxRef = useRef(null);
  const cameraRef = useRef(null);
  const hoverFaceRef = useRef(null);
  const [currentView, setCurrentView] = useState('Front');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [previewMesh, setPreviewMesh] = useState(null);
  const meshesRef = useRef({});
  const planesRef = useRef({});
  const highlightLayerRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const model = useHypeStudioModel();

  const createControlCube = useCallback((scene, onFaceClick) => {
    const cube = MeshBuilder.CreateBox("controlCube", { size: 0.5 }, scene);
    const cubeMaterial = new StandardMaterial("cubeMaterial", scene);
    cubeMaterial.wireframe = true;
    cube.material = cubeMaterial;

    const faceNames = ["Front", "Back", "Left", "Right", "Top", "Bottom"];
    const faceNormals = [
      new Vector3(0, 0, 1),
      new Vector3(0, 0, -1),
      new Vector3(-1, 0, 0),
      new Vector3(1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, -1, 0)
    ];

    faceNames.forEach((name, index) => {
      const faceMesh = MeshBuilder.CreatePlane(name, { size: 0.65 }, scene);
      faceMesh.parent = cube;
      faceMesh.position = faceNormals[index].scale(0.5);
      faceMesh.lookAt(faceMesh.position.add(faceNormals[index]));

      const faceMaterial = new StandardMaterial(name + "Material", scene);
      faceMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
      faceMaterial.alpha = 0.7;
      faceMesh.material = faceMaterial;

      faceMesh.actionManager = new ActionManager(scene);
      console.log(`Registering action for face: ${name}`);
      faceMesh.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPickTrigger,
          () => {
            console.log(`Action triggered for face: ${name}`);
            if (hoverFaceRef.current) {
                onFaceClick(hoverFaceRef.current);
            } else {
                onFaceClick(faceNormals[index]);
            }
          }
        )
      );

      faceMesh.actionManager.registerAction(
        new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            () => {
                faceMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3);
                hoverFaceRef.current = name;
            }
        )
    );

    faceMesh.actionManager.registerAction(
        new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger,
            () => {
                faceMaterial.emissiveColor = new Color3(0, 0, 0);
                hoverFaceRef.current = null;
            }
        )
    );
    });

    return cube;
  }, []);

  const handleSketchInteraction = useCallback((sketchId, pickResult) => {
    const sketch = model.elements.sketches[sketchId];
    if (sketch) {
      const closestPointIndex = meshUtils.findClosestPointIndex(sketch.geometry, pickResult.pickedPoint);
      if (closestPointIndex !== -1) {
        meshUtils.startDragOperation(
          sceneRef.current,
          (dragPoint) => {
            const newGeometry = [...sketch.geometry];
            newGeometry[closestPointIndex] = {
              x: dragPoint.x,
              y: dragPoint.y
            };
            model.updateElement('sketches', sketchId, { geometry: newGeometry });
          }
        );
      }
    }
  }, [model]);

  const handleExtrusionInteraction = useCallback((extrusionId, pickResult) => {
    const extrusion = model.elements.extrusions[extrusionId];
    if (extrusion) {
      const startDepth = extrusion.depth;
      const startY = pickResult.pickedPoint.y;

      meshUtils.startDragOperation(
        sceneRef.current,
        (dragPoint) => {
          const depthChange = dragPoint.y - startY;
          const newDepth = Math.max(0, startDepth + depthChange);
          model.updateElement('extrusions', extrusionId, { depth: newDepth });
        }
      );
    }
  }, [model]);

  useEffect(() => {

    if (!engine || !canvas) return;

    // Main scene
    const mainScene = new Scene(engine);
    sceneRef.current = mainScene;

    mainScene.clearColor = new Color3(0.95, 0.95, 0.95);

    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), mainScene);
    cameraRef.current = camera;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), mainScene);
    light.intensity = 0.7;

    const box = MeshBuilder.CreateBox("extrusions_1", { size: 2 }, mainScene);
    const boxMaterial = new StandardMaterial("boxMaterial", mainScene);
    boxMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    box.material = boxMaterial;

    // Control scene
    const controlScene = new Scene(engine);
    controlSceneRef.current = controlScene;
    controlScene.autoClear = false; // This is crucial for overlaying
    controlScene.detachControl();
    controlScene.attachControl(canvas, true);
    const controlCamera = new ArcRotateCamera("controlCamera", Math.PI / 4, Math.PI / 3, 10, Vector3.Zero(), controlScene);
    controlCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    controlCamera.orthoTop = 1;
    controlCamera.orthoBottom = -1;
    controlCamera.orthoLeft = -1;
    controlCamera.orthoRight = 1;

    const controlLight = new HemisphericLight("controlLight", new Vector3(0, 1, 0), controlScene);

    const controlCube = createControlCube(controlScene, (normal) => {
      const newView = getViewFromNormal(normal);
      console.log(newView);
      setCurrentView(newView);
      onViewChange(newView);
    });

    // Set up viewport for control scene
    controlScene.createDefaultCamera = false;
    controlScene.createDefaultLight = false;
    const controlViewport = new Viewport(0.75, 0.45, 0.25, 0.5);
    controlCamera.viewport = controlViewport;

    mainScene.getSketchById = (id) => {
      return model.elements.sketches[id];
    };

    highlightLayerRef.current = new HighlightLayer("highlightLayer", mainScene);

    const createPlane = (axis) => {
      const plane = MeshBuilder.CreatePlane(`${axis}Plane`, { size: 10 }, mainScene);
      const material = new StandardMaterial(`${axis}PlaneMaterial`, mainScene);
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

    planesRef.current = {
      X: createPlane('X'),
      Y: createPlane('Y'),
      Z: createPlane('Z')
    };

    engine.runRenderLoop(() => {
      mainScene.render();
      controlScene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    const handleMainScenePointerMove = (evt) => {

      if (isDrawing && previewMesh) {
        const pickInfo = mainScene.pick(evt.offsetX, evt.offsetY);
        if (pickInfo.hit) {
          updatePreviewMesh(previewMesh, startPoint, pickInfo.pickedPoint, selectedSketchType);
        }
      }
    }

    const handleMainScenePointerUp = (evt) => {

      if (isDrawing && previewMesh) {
        setIsDrawing(false);
        
        // Create the actual sketch
        const sketchData = getSketchDataFromPreview(previewMesh, selectedSketchType);
        onSketchCreate(selectedSketchType, sketchData);
        
        // Remove preview mesh
        previewMesh.dispose();
        setPreviewMesh(null);
      }
      
    }
    
        const handleMainScenePointerDown = (evt) => {
          if (evt.button === 2) {
              evt.preventDefault();
              return;
          }
  
          const scene = sceneRef.current;
          const pickResult = scene.pick(evt.offsetX, evt.offsetY);

          if (activeView === 'Sketch View' && selectedSketchType && pickResult.hit && pickResult.pickedMesh.name.includes('Plane')) {
            setIsDrawing(true);
            setStartPoint(pickResult.pickedPoint);
            
            // Create preview mesh
            const newPreviewMesh = createPreviewMesh(selectedSketchType, pickResult.pickedPoint);
            setPreviewMesh(newPreviewMesh);
          } else {
            let meshes = meshesRef.current;
            if (pickResult.hit) {
                let pickedNode = pickResult.pickedMesh;
                while (pickedNode && !(pickedNode instanceof TransformNode)) {
                    pickedNode = pickedNode.parent;
                }
                
                if (pickedNode) {
                    const nodeId = pickedNode.id;
  
                    // Clear previous selection
                    if (selectedNodeId && meshes[selectedNodeId]) {
                        meshUtils.unhighlightMesh(meshes[selectedNodeId]);
                    }
            
                    // Set new selection
                    setSelectedNodeId(nodeId);
                    model.selectElement(nodeId);
                    meshUtils.highlightMesh(scene, pickedNode);
                    
                    onSelectionChange(nodeId);
            
                    const elementType = nodeId.split('_')[0];
                    switch (elementType) {
                        default:
                        case 'sketch':
                            handleSketchInteraction(nodeId, pickResult);
                            break;
                        case 'extrusion':
                            handleExtrusionInteraction(nodeId, pickResult);
                            break;
                        // Add cases for other element types
                    }
                }
            } else {
                // Clear selection if clicking on empty space
                if (selectedNodeId && meshes[selectedNodeId]) {
                    meshUtils.unhighlightMesh(meshes[selectedNodeId]);
                }
                setSelectedNodeId(null);
                model.selectElement(null);
                onSelectionChange(null);
            }
          }
      };
  
      mainScene.onPointerDown = handleMainScenePointerDown;
      mainScene.onPointerMove = handleMainScenePointerMove;
      mainScene.onPointerUp = handleMainScenePointerUp;
  
      return () => {
          window.removeEventListener("resize", engine.resize);
      };
  }, [createControlCube, onViewChange, handleExtrusionInteraction, handleSketchInteraction, model.elements.sketches, model, 
      selectedNodeId, activeView, onSelectionChange, canvas, engine, isDrawing, onSketchCreate, previewMesh, selectedSketchType,
    startPoint]);

  const renderModelToScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
  
    const newMeshes = { ...meshesRef.current };
  
    for (const elementType in model.elements) {
      Object.values(model.elements[elementType]).forEach(element => {
        const customProperties = model.customProperties[element.id];
        if (newMeshes[element.id]) {
          newMeshes[element.id] = meshUtils.manageElementMesh(scene, element, elementType, newMeshes[element.id], customProperties);
        } else {
          newMeshes[element.id] = meshUtils.manageElementMesh(scene, element, elementType, null, customProperties);
        }
        if (newMeshes[element.id]) {
          newMeshes[element.id].id = element.id;
        }
      });
    }
  
    // Remove meshes for deleted elements
    Object.keys(newMeshes).forEach(meshId => {
      if (!Object.values(model.elements).some(elements => elements[meshId])) {
        if (newMeshes[meshId] instanceof TransformNode) {
          newMeshes[meshId].getChildMeshes().forEach(mesh => mesh.dispose());
        }
        newMeshes[meshId].dispose();
        delete newMeshes[meshId];
      }
    });
  
    meshesRef.current = newMeshes;
  }, [model.elements, model.customProperties]);
  
  useEffect(() => {
    if (sceneRef.current) {
      renderModelToScene();
    }
  }, [renderModelToScene]);

  useEffect(() => {
    if (cameraRef.current) {
      updateCameraPosition(currentView);
    }
  }, [currentView]);

  const updateCameraControls = useCallback(() => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    // Store current camera position and target
    const currentPosition = camera.position.clone();
    const currentTarget = camera.target.clone();

    // Reset camera to apply new controls
    camera.detachControl();
    camera.inputs.clear();

    switch (controlMode) {
      case 'zoom':
        camera.inputs.addMouseWheel();
        break;
      case 'pan':
        camera.inputs.addPointers();
        camera.panningSensibility = 50;
        camera.inputs.attached.pointers.buttons = [0]; // Left mouse button
        camera.inputs.attached.pointers.angularSensibilityX = 0;
        camera.inputs.attached.pointers.angularSensibilityY = 0;
        
        // Override onButtonDown for custom pan behavior
        const originalOnButtonDown = camera.inputs.attached.pointers.onButtonDown;
        camera.inputs.attached.pointers.onButtonDown = (evt) => {
          if (evt.button === 0) { // Left mouse button
            camera.inputs.attached.pointers._isPanClick = true;
            evt.preventDefault();
          } else {
            originalOnButtonDown(evt);
          }
        };
        break;
      case 'rotate':
      default:
        camera.inputs.addMouseWheel();
        camera.inputs.addPointers();
        camera.inputs.attached.pointers.buttons = [0, 1]; // Left and middle mouse buttons
        break;
    }

    // Reattach control and restore camera position and target
    camera.attachControl(canvasRef.current, true);
    camera.setPosition(currentPosition);
    camera.setTarget(currentTarget);

    // Prevent context menu on right-click
    scene.onPointerDown = (evt) => {
      if (evt.button === 2) {
        evt.preventDefault();
      }
    };

    console.log(`Control mode updated to: ${controlMode}`);
  }, [controlMode]);

  useEffect(() => {
    if (cameraRef.current && sceneRef.current) {
      updateCameraControls();
    }
  }, [controlMode, updateCameraControls]);

  const getViewFromNormal = (normal) => {
    if (typeof normal.equalsWithEpsilon !== 'function') {
        if (hoverFaceRef.current) {
            return hoverFaceRef.current;
        } else {
            return "Front";
        }
    }
    if (normal.equalsWithEpsilon(Vector3.Right())) return "Right";
    if (normal.equalsWithEpsilon(Vector3.Left())) return "Left";
    if (normal.equalsWithEpsilon(Vector3.Up())) return "Top";
    if (normal.equalsWithEpsilon(Vector3.Down())) return "Bottom";
    if (normal.equalsWithEpsilon(Vector3.Forward())) return "Front";
    if (normal.equalsWithEpsilon(Vector3.Backward())) return "Back";
    return "Front"; // Default view
  };

  const updateCameraPosition = (view) => {
    const camera = cameraRef.current;
    if (!camera) return;

    console.log("Updating camera position for view:", view);  // Debug log
    
    switch (view) {
      case "Front":
        camera.setPosition(new Vector3(0, 0, -10));
        break;
      case "Back":
        camera.setPosition(new Vector3(0, 0, 10));
        break;
      case "Left":
        camera.setPosition(new Vector3(-10, 0, 0));
        break;
      case "Right":
        camera.setPosition(new Vector3(10, 0, 0));
        break;
      case "Top":
        camera.setPosition(new Vector3(0, 10, 0));
        break;
      case "Bottom":
        camera.setPosition(new Vector3(0, -10, 0));
        break;
      default:
        break;
    }
    camera.setTarget(Vector3.Zero());
  };

  const createPreviewMesh = (type, startPoint) => {
    let mesh;
    if (type === 'circle') {
      mesh = MeshBuilder.CreateDisc('preview', { radius: 0.1 }, sceneRef.current);
    } else if (type === 'rectangle') {
      mesh = MeshBuilder.CreatePlane('preview', { width: 0.1, height: 0.1 }, sceneRef.current);
    }
    
    if (mesh) {
      mesh.position = startPoint;
      const material = new StandardMaterial("previewMaterial", sceneRef.current);
      material.diffuseColor = new Color3(0, 1, 0); // Green color for preview
      material.alpha = 0.5;
      mesh.material = material;
    }
    
    return mesh;
  };
  
  const updatePreviewMesh = (mesh, startPoint, endPoint, type) => {
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
  
  const getSketchDataFromPreview = (previewMesh, type) => {
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

  const updateCameraForPlane = (plane) => {
    if (cameraRef.current) {
      switch (plane) {
        default:
        case 'X':
          cameraRef.current.setPosition(new Vector3(10, 0, 0));
          break;
        case 'Y':
          cameraRef.current.setPosition(new Vector3(0, 10, 0));
          break;
        case 'Z':
          cameraRef.current.setPosition(new Vector3(0, 0, 10));
          break;
      }
      cameraRef.current.setTarget(Vector3.Zero());
    }
  };

  useImperativeHandle(ref, () => ({
    changePlanesState: (planes) => {
      planesRef.current = planes;
    }
  }));
  
  useEffect(() => {
    if (sceneRef.current && planesRef.current && cameraRef.current) {
      Object.entries(planeStates).forEach(([plane, state]) => {
        if (state === PlaneState.ALIGNED) {
          updateCameraForPlane(plane);
        }
      });
    }
    // if (sceneRef.current && planesRef.current && cameraRef.current) {
    //   Object.entries(planeStates).forEach(([plane, state]) => {
    //     const planeMesh = planesRef.current[plane];
    //     planeMesh.isVisible = state !== PlaneState.HIDDEN;
        
    //     if (state === PlaneState.ALIGNED) {
    //       highlightLayerRef.current.addMesh(planeMesh, Color3.Yellow());
    //       updateCameraForPlane(plane);
    //     } else {
    //       highlightLayerRef.current.removeMesh(planeMesh);
    //     }
    //   });
    // }
  }, [planeStates]);

  return null;
}));