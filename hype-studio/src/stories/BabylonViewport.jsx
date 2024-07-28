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
    
    const createFaceButton = (name, path, hoverPath, x, y, width, height) => {
      const button = Button.CreateImageOnlyButton(name, "data:image/svg+xml;base64," + btoa(`
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="${path}" fill="transparent" stroke="white" stroke-width="2" />
        </svg>
      `));

      button.width = "100px";
      button.height = "100px";
      button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      button.top = "60px";
      button.left = "-10px";
      button.thickness = 0;
      button.background = "transparent";
      button.color = "transparent";

      button.onPointerEnterObservable.add(() => {
        button.image.source = "data:image/svg+xml;base64," + btoa(`
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="${hoverPath}" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="2" />
          </svg>
        `);
      });

      button.onPointerOutObservable.add(() => {
        button.image.source = "data:image/svg+xml;base64," + btoa(`
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="${path}" fill="transparent" stroke="white" stroke-width="2" />
          </svg>
        `);
      });

      button.onPointerUpObservable.add(() => {
        onFaceClick(getFaceNormal(name));
      });

      advancedTexture.addControl(button);

      return { button, hoverPath };
    };

    // Create buttons for each face
    createFaceButton(
      "Front",
      "M20 80 L80 80 L80 20 L20 20 Z",
      "M20 80 L80 80 L80 20 L20 20 Z",
      20, 20, 60, 60
    );
    createFaceButton(
      "Top",
      "M20 20 L35 5 L95 5 L80 20",
      "M20 20 L35 5 L95 5 L80 20 Z",
      20, 5, 60, 15
    );
    createFaceButton(
      "Right",
      "M80 20 L95 5 L95 65 L80 80",
      "M80 20 L95 5 L95 65 L80 80 Z",
      80, 20, 15, 60
    );
    createFaceButton(
      "Left",
      "M20 20 L35 5 L35 65 L20 80",
      "M20 20 L35 5 L35 65 L20 80 Z",
      5, 20, 15, 60
    );
    createFaceButton(
      "Bottom",
      "M20 80 L35 65 L95 65 L80 80",
      "M20 80 L35 65 L95 65 L80 80 Z",
      20, 80, 60, 15
    );
    var backFaceButton = createFaceButton(
        "Back",
        "M35 5 L95 5 L95 65 L35 65 Z",
        "M35 5 L95 5 L95 65 L35 65 Z"
    );

    // Create a button for the back face (surrounding area)
    const backButton = new Rectangle();

    backButton.width = "100px";
    backButton.height = "100px";
    backButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    backButton.top = "60px";
    backButton.left = "-10px";
    backButton.thickness = 5;
    backButton.color = "transparent";
    backButton.background = "transparent";

    backButton.onPointerEnterObservable.add(() => {
        backFaceButton.button.image.source = "data:image/svg+xml;base64," + btoa(`
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="${backFaceButton.hoverPath}" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="2" />
          </svg>
        `);
      });

    backButton.onPointerOutObservable.add(() => {
        backFaceButton.button.image.source = "data:image/svg+xml;base64," + btoa(`
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="${backFaceButton.hoverPath}" fill="transparent" stroke="white" stroke-width="2" />
            </svg>
        `);
    });

    backButton.onPointerUpObservable.add(() => {
      onFaceClick(getFaceNormal("Back"));
    });

    advancedTexture.addControl(backButton);
  }, []);

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