import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, UtilityLayerRenderer, ExecuteCodeAction, DynamicTexture,
  StandardMaterial, Color3, Camera, ActionManager, Matrix, RenderTargetTexture, Viewport, Mesh
} from '@babylonjs/core';
import { Button, Rectangle, Line, AdvancedDynamicTexture, MeshButton3D, StackPanel3D, Control, StackPanel } from '@babylonjs/gui';

export const BabylonViewport = ({ currentModelView, onViewChange, controlMode }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const controlSceneRef = useRef(null);
  const boxRef = useRef(null);
  const cameraRef = useRef(null);
  const [currentView, setCurrentView] = useState('Front');

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
      faceMesh.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPickTrigger,
          () => onFaceClick(faceNormals[index])
        )
      );
    });

    return cube;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    // Main scene
    const mainScene = new Scene(engine);
    sceneRef.current = mainScene;

    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), mainScene);
    cameraRef.current = camera;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), mainScene);
    light.intensity = 0.7;

    const box = MeshBuilder.CreateBox("box", { size: 2 }, mainScene);
    const boxMaterial = new StandardMaterial("boxMaterial", mainScene);
    boxMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    box.material = boxMaterial;

    // Control scene
    const controlScene = new Scene(engine);
    controlSceneRef.current = controlScene;
    controlScene.autoClear = false; // This is crucial for overlaying

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

    engine.runRenderLoop(() => {
      mainScene.render();
      controlScene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

        if (currentModelView === '') {
      onViewChange('Front');
    }

    // Prevent default behavior for right-click
    mainScene.onPointerDown = (evt) => {
        if (evt.button === 2) {
            evt.preventDefault();
        }
        };

    return () => {
      engine.dispose();
    };
  }, [createControlCube, onViewChange, currentModelView]);

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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};