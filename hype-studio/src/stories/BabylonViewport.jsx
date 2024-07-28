import React, { useEffect, useRef, useState } from 'react';
import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder,
  StandardMaterial, Color3, PointerEventTypes
} from '@babylonjs/core';

export const BabylonViewport = ({ onViewChange, controlMode }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const boxRef = useRef(null);
  const cameraRef = useRef(null);
  const [currentView, setCurrentView] = useState('Front');

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Camera
    const camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, false); // We'll handle control manually
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

    return () => {
      engine.dispose();
    };
  }, [onViewChange]);

  useEffect(() => {
    if (cameraRef.current) {
      updateCameraPosition(currentView);
    }
  }, [currentView]);

  useEffect(() => {
    if (cameraRef.current && sceneRef.current) {
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      
      // Reset all camera controls
      camera.inputs.clear();

      switch (controlMode) {
        case 'zoom':
          camera.inputs.addMouseWheel();
          break;
        case 'pan':
          camera.inputs.addPointers();
          camera.panningSensibility = 50;
          camera.inputs.attached.pointers.buttons = [1]; // Middle mouse button
          break;
        case 'rotate':
          camera.inputs.addPointers();
          camera.inputs.attached.pointers.buttons = [0, 1]; // Left and middle mouse buttons
          break;
        default:
          break;
      }

      // Prevent default behavior for right-click
      scene.onPointerDown = (evt) => {
        if (evt.button === 2) {
          evt.preventDefault();
        }
      };
    }
  }, [controlMode]);

  const createWireframeCube = (scene, onFaceClick) => {
    const size = 0.5;
    const positions = [
      new Vector3(-size, size, -size),
      new Vector3(size, size, -size),
      new Vector3(size, size, size),
      new Vector3(-size, size, size),
      new Vector3(-size, -size, -size),
      new Vector3(size, -size, -size),
      new Vector3(size, -size, size),
      new Vector3(-size, -size, size)
    ];

    const lines = [
      [0, 1], [1, 2], [2, 3], [3, 0], // top
      [4, 5], [5, 6], [6, 7], [7, 4], // bottom
      [0, 4], [1, 5], [2, 6], [3, 7]  // sides
    ];

    const wireframeCube = MeshBuilder.CreateLineSystem("wireframeCube", {
      lines: lines.map(pair => [positions[pair[0]], positions[pair[1]]]),
      updatable: false
    }, scene);

    wireframeCube.position = new Vector3(2.5, 2.5, -2.5);
    wireframeCube.scaling = new Vector3(0.5, 0.5, 0.5);

    const wireframeMaterial = new StandardMaterial("wireframeMaterial", scene);
    wireframeMaterial.emissiveColor = Color3.White();
    wireframeCube.material = wireframeMaterial;

    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo.hit) {
        const pickedMesh = pointerInfo.pickInfo.pickedMesh;
        if (pickedMesh === wireframeCube) {
          const pickResult = scene.pick(scene.pointerX, scene.pointerY);
          if (pickResult.hit) {
            const normal = pickResult.getNormal();
            if (normal) {
              onFaceClick(normal);
            }
          }
        }
      }
    });
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