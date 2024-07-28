import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder,
  StandardMaterial, Color3, PointerInput
} from '@babylonjs/core';
import { Button, Rectangle, AdvancedDynamicTexture, Control } from '@babylonjs/gui';

export const BabylonViewport = ({ currentModelView, onViewChange, controlMode }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const boxRef = useRef(null);
  const cameraRef = useRef(null);
  const [currentView, setCurrentView] = useState('Front');

  const createWireframeCube = useCallback((scene, onFaceClick) => {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    const button = Button.CreateImageOnlyButton("wireframeButton", "data:image/svg+xml;base64," + btoa(`
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 80 L80 80 L80 20 L20 20 Z" fill="none" stroke="white" stroke-width="2"/>
        <path d="M20 20 L35 5 L95 5 L80 20" fill="none" stroke="white" stroke-width="2"/>
        <path d="M80 80 L95 65 L95 5" fill="none" stroke="white" stroke-width="2"/>
        <path d="M20 80 L35 65 L95 65" fill="none" stroke="white" stroke-width="2"/>
        <path d="M35 5 L35 65" fill="none" stroke="white" stroke-width="2"/>
      </svg>
    `));

    button.width = "100px";
    button.height = "100px";
    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    button.top = "60px";
    button.left = "-10px";
    
    button.onPointerUpObservable.add((eventData) => {
      const buttonRect = button._currentMeasure;
      const screenWidth = scene.getEngine().getRenderWidth();
      const screenHeight = scene.getEngine().getRenderHeight();

      const buttonLeft = screenWidth - parseFloat(button.width) + parseFloat(button.left);
      const buttonTop = parseFloat(button.top);

      const relativeX = eventData.x - buttonLeft;
      const relativeY = eventData.y - buttonTop;

      const normalizedX = relativeX / parseFloat(button.width);
      const normalizedY = relativeY / parseFloat(button.height);

      console.log("Normalized click position:", normalizedX, normalizedY);  // Debug log

      if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
        const face = determineFaceClicked(normalizedX, normalizedY);
        console.log("Clicked face:", face);  // Debug log

        const normal = getFaceNormal(face);
        console.log("Face normal:", normal);  // Debug log

        onFaceClick(normal);
      } else {
        console.log("Click outside the button");
      }
    });

    advancedTexture.addControl(button);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Camera
    const camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    cameraRef.current = camera;

    // Light
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Main box
    const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
    const boxMaterial = new StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    box.material = boxMaterial;
    boxRef.current = box;

    // Wireframe cube
    createWireframeCube(scene, (normal) => {
      const newView = getViewFromNormal(normal);
      setCurrentView(newView);
      onViewChange(newView);
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    if (currentModelView === '') {
      onViewChange('Front');
    }

    // Prevent default behavior for right-click
    scene.onPointerDown = (evt) => {
        if (evt.button === 2) {
            evt.preventDefault();
        }
        };

    return () => {
      engine.dispose();
    };
  }, [onViewChange, currentModelView, createWireframeCube]);

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

  const determineFaceClicked = (normalizedX, normalizedY) => {
    if (normalizedY < 0.2) {
      return normalizedX < 0.6 ? "Top" : "Back";
    } else if (normalizedY > 0.8) {
      return "Bottom";
    } else if (normalizedX < 0.2) {
      return "Left";
    } else if (normalizedX > 0.8) {
      return "Right";
    } else {
      return "Front";
    }
  };

  const getFaceNormal = (face) => {
    switch (face) {
      case "Right": return new Vector3(1, 0, 0);
      case "Left": return new Vector3(-1, 0, 0);
      case "Top": return new Vector3(0, 1, 0);
      case "Bottom": return new Vector3(0, -1, 0);
      case "Front": return new Vector3(0, 0, 1);
      case "Back": return new Vector3(0, 0, -1);
      default: return new Vector3(0, 0, 1);
    }
  };

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