import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, ExecuteCodeAction,
  StandardMaterial, Color3, PointerInput, Tools, ActionManager, Matrix, RenderTargetTexture, Viewport, Mesh
} from '@babylonjs/core';
import { Button, Rectangle, AdvancedDynamicTexture, Control, StackPanel } from '@babylonjs/gui';

export const BabylonViewport = ({ currentModelView, onViewChange, controlMode }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  // const cubeSceneRef = useRef(null);
  const boxRef = useRef(null);
  const cameraRef = useRef(null);
  const [currentView, setCurrentView] = useState('Front');

  const createFacePlanes = (scene, cube, onFaceClick) => {
    const faces = [];
    const faceNames = ["front", "back", "right", "left", "top", "bottom"];
    const faceNormals = [
      new Vector3(0, 0, 1),
      new Vector3(0, 0, -1),
      new Vector3(1, 0, 0),
      new Vector3(-1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, -1, 0),
    ];
  
    for (let i = 0; i < 6; i++) {
        const face = MeshBuilder.CreatePlane("face" + (i + 1), { size: 2 }, scene);
        face.position.copyFrom(faceNormals[i]);
        face.parent = cube;
        if (i === 1) { // Back face
          face.rotation.y = Math.PI;
        } else if (i === 2) { // Right face
          face.rotation.y = Math.PI / 2;
        } else if (i === 3) { // Left face
          face.rotation.y = -Math.PI / 2;
        } else if (i === 4) { // Top face
          face.rotation.x = -Math.PI / 2;
        } else if (i === 5) { // Bottom face
          face.rotation.x = Math.PI / 2;
        }
      
        faces.push(face);
      }
    return faces;
  }

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

    advancedTexture.addControl(backFaceButton.rectangle);

    // Render Target Texture for Cube Control
    const renderTarget = new RenderTargetTexture("cubeControlRenderTarget", 100, scene); // Adjust size as needed
    renderTarget.renderList = [];

    // Plane to Display Render Target (positioned at the top-right)
    const plane = MeshBuilder.CreatePlane("cubeControlPlane", { width: 1, height: 1 }, scene);
    const material = new StandardMaterial("cubeControlMaterial", scene);
    material.diffuseTexture = renderTarget;
    plane.material = material;
    plane.position = new Vector3(3, 0, 0); // Top-right position
    plane.parent = cameraRef.current; // Optionally parent to camera to keep it in view
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL; // Always face the camera

    // Cube Creation and Setup (Previously in cubeScene)
    const cubeControl = MeshBuilder.CreateBox("cubeControl", { size: 2 }, scene);
    cubeControl.scaling = new Vector3(0.5, 0.5, 0.5); // Adjust scaling
    cubeControl.rotation.y = Tools.ToRadians(45);
    cubeControl.rotation.x = Tools.ToRadians(30);

    // Face Planes Creation (Within the main scene now)
    const facePlanes = createFacePlanes(scene, cubeControl, onFaceClick);
    renderTarget.renderList.push(cubeControl, ...facePlanes); // Add all meshes to render list

    // Interaction Handling (on the plane, not the texture)
    plane.actionManager = new ActionManager(scene);
    plane.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger,   
    (evt) => {
        const pickInfo = scene.pick(evt.pointerX, evt.pointerY);
        if (pickInfo.hit && pickInfo.pickedMesh === plane) {
            const localPickCoords = {
                x: (pickInfo.pickedPoint.x - plane.position.x + 0.5) * renderTarget.getSize().width,
                y: (0.5 - (pickInfo.pickedPoint.y - plane.position.y)) * renderTarget.getSize().height
              };
              
              // Use ray casting to determine which face was clicked
              const ray = scene.createPickingRay(localPickCoords.x, localPickCoords.y, Matrix.Identity(), renderTarget.renderList[0].getScene().activeCamera);
              const pickResult = scene.pickWithRay(ray, mesh => facePlanes.includes(mesh));
              
              if (pickResult.hit) {
                const clickedFace = pickResult.pickedMesh.name;
                onFaceClick(getFaceNormal(clickedFace));
              }
        }
        })
    );

    // Render the render target in the main scene's render loop
    let lastRenderTime = 0;
    scene.onBeforeRenderObservable.add(() => {
    const currentTime = performance.now();
    if (currentTime - lastRenderTime > 100) { // Render every 100ms
        renderTarget.render();
        lastRenderTime = currentTime;
    }
    });
    
    // // Create a small 3D scene for the cube inside the rectangle
    // var cubeScene = new Scene(engineRef.current);
    // cubeSceneRef.current = cubeScene;
    // var cubeCamera = new ArcRotateCamera("cubeCamera", Math.PI / 4, Math.PI / 4, 10, Vector3.Zero(), cubeScene);

    // var cubeLight = new HemisphericLight("cubeLight", new Vector3(0, 1, 0), cubeScene);

    // // Create the main cube mesh
    // var cube = MeshBuilder.CreateBox("cube", { size: 2 }, cubeScene);

    // // Create the cube instance for the small scene
    // var cubeInstance = cube.clone("cubeInstance");
    // cubeInstance.parent = null; // Ensure it's not affected by the main scene
    // cubeInstance.scaling = new Vector3(0.5, 0.5, 0.5); // Scale down for the small scene
    // cubeInstance.position = new Vector3(-5, 2, 2); 

    // // Add the cube to the small scene
    // cubeScene.addMesh(cubeInstance);

    // // Create individual plane meshes for each face
    // var face1 = MeshBuilder.CreatePlane("face1", { size: 2 }, cubeScene);
    // var face2 = MeshBuilder.CreatePlane("face2", { size: 2 }, cubeScene);
    // var face3 = MeshBuilder.CreatePlane("face3", { size: 2 }, cubeScene);
    // var face4 = MeshBuilder.CreatePlane("face4", { size: 2 }, cubeScene);
    // var face5 = MeshBuilder.CreatePlane("face5", { size: 2 }, cubeScene);
    // var face6 = MeshBuilder.CreatePlane("face6", { size: 2 }, cubeScene);

    // // Position and orient each plane to align with the cube faces
    // face1.position = new Vector3(0, 0, 1);  // Front face
    // face2.position = new Vector3(0, 0, -1); // Back face
    // face2.rotation.y = Math.PI;
    // face3.position = new Vector3(1, 0, 0);  // Right face
    // face3.rotation.y = Math.PI / 2;
    // face4.position = new Vector3(-1, 0, 0); // Left face
    // face4.rotation.y = -Math.PI / 2;
    // face5.position = new Vector3(0, 1, 0);  // Top face
    // face5.rotation.x = -Math.PI / 2;
    // face6.position = new Vector3(0, -1, 0); // Bottom face
    // face6.rotation.x = Math.PI / 2;

    // // Parent the plane meshes to the main cube
    // face1.parent = cubeInstance;
    // face2.parent = cubeInstance;
    // face3.parent = cubeInstance;
    // face4.parent = cubeInstance;
    // face5.parent = cubeInstance;
    // face6.parent = cubeInstance;

    // // Rotate the cube
    // cubeInstance.rotation.y = Tools.ToRadians(45);
    // cubeInstance.rotation.x = Tools.ToRadians(30);

    // // Add action manager to the identified face
    // face3.actionManager = new ActionManager(scene);

    // // Register a click action on face3
    // face3.actionManager.registerAction(
    //     new ExecuteCodeAction(ActionManager.OnPickTrigger, function () {
    //         console.log("Clicked the parallelogram face!");
    //         // Add your desired click logic here
    //     })
    // );

    // // Create a render target texture for the cube
    // var renderTarget = new RenderTargetTexture("renderTarget", { width: 100, height: 100 }, cubeScene);
    // renderTarget.renderList.push(cubeInstance);
    // renderTarget.activeCamera = cubeCamera;
    
    // // Render cubeScene to the render target after the main scene is rendered
    // scene.onAfterRenderObservable.add(() => {
    //     // cubeScene.render();
    // });

    // Handle pointer events on the render target texture
    // cubeTexture.onPointerDownObservable.add(function (pointerInfo, eventState) {
    //     const engine = cubeScene.getEngine();
    //     const canvas = engine.getRenderingCanvas();

    //     // Get 2D coordinates of the pointer on the render target
    //     const x = (pointerInfo.x / canvas.clientWidth) * 2 - 1;
    //     const y = -(pointerInfo.y / canvas.clientHeight) * 2 + 1;

    //     // Convert 2D coordinates to a 3D picking ray
    //     const ray = cubeScene.createPickingRay(x, y, Matrix.Identity(), cubeCamera);

    //     // Perform the pick operation on the cubeScene
    //     const pickInfo = cubeScene.pickWithRay(ray);

    //     if (pickInfo.hit && pickInfo.pickedMesh === face3) { // Check if the picked mesh is the parallelogram face
    //         console.log("Clicked the parallelogram face!");
    //         // Add your desired click logic here
    //     }
    // });
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
    engineRef.current = engine;
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
      //setTimeout(() => {
        //if (cubeSceneRef.current)
           // cubeSceneRef.current.render();
      //}, 0); 
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