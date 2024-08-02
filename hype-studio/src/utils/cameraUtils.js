import { 
    Vector3
  } from '@babylonjs/core';

export const updateCameraControls = (camera, controlMode, canvas) => {
    camera.inputs.clear();
  
    switch (controlMode) {
      case 'pointer':
      case 'drawing':
      case 'dimension':
      case 'zoom':
        camera.inputs.addMouseWheel();

        // Adjust zoom speed
        camera.inputs.attached.mousewheel.wheelPrecisionY = 5; 

        // Adjust zoom step size
        camera.wheelDeltaPercentage = 0.02; 
        break;
      case 'pan':
        camera.inputs.addPointers();
        camera.panningSensibility = 150;
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
        break;
    }
  
    camera.attachControl(canvas, true);
  };

export const updateCameraForPlane = (camera, plane) => {
    switch (plane) {
      default:
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

  export const updateCameraPosition = (camera, view) => {
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