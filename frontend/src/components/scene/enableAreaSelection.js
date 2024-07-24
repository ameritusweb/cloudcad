import * as BABYLON from 'babylonjs';

function enableAreaSelection(scene, onAreaSelected) {
  const selectionPoints = [];
  let selectionMesh = null;

  scene.onPointerDown = function (evt, pickResult) {
    if (pickResult.hit) {
      selectionPoints.push(pickResult.pickedPoint);
      
      if (selectionMesh) {
        selectionMesh.dispose();
      }

      if (selectionPoints.length > 2) {
        selectionMesh = BABYLON.MeshBuilder.CreatePolygon("selection", {shape: selectionPoints, updatable: true}, scene);
        const selectionMaterial = new BABYLON.StandardMaterial("selectionMaterial", scene);
        selectionMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        selectionMaterial.alpha = 0.3;
        selectionMesh.material = selectionMaterial;
      }
    }
  };

  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      switch (kbInfo.event.key) {
        case "Enter":
          if (selectionPoints.length > 2) {
            onAreaSelected(selectionPoints);
            selectionPoints.length = 0;
            if (selectionMesh) {
              selectionMesh.dispose();
            }
          }
          break;
        case "Escape":
          selectionPoints.length = 0;
          if (selectionMesh) {
            selectionMesh.dispose();
          }
          break;
      }
    }
  });
}

export default enableAreaSelection;