import * as BABYLON from 'babylonjs';

function enableMultipleObjectSelection(scene, onSelectionComplete) {
  const selectedMeshes = new Set();
  const highlightMaterial = new BABYLON.StandardMaterial("highlightMaterial", scene);
  highlightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);

  const originalMaterials = new Map();

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
      const pickedMesh = pointerInfo.pickInfo.pickedMesh;
      if (pickedMesh && !pickedMesh.isGround) {
        if (selectedMeshes.has(pickedMesh)) {
          // Deselect
          selectedMeshes.delete(pickedMesh);
          pickedMesh.material = originalMaterials.get(pickedMesh);
        } else {
          // Select
          selectedMeshes.add(pickedMesh);
          originalMaterials.set(pickedMesh, pickedMesh.material);
          pickedMesh.material = highlightMaterial;
        }
      }
    }
  });

  // Add a button to complete selection
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  const button = BABYLON.GUI.Button.CreateSimpleButton("completeSelection", "Complete Selection");
  button.width = "150px";
  button.height = "40px";
  button.color = "white";
  button.cornerRadius = 20;
  button.background = "green";
  button.onPointerUpObservable.add(() => {
    const selectedObjects = Array.from(selectedMeshes);
    onSelectionComplete(selectedObjects);
    
    // Reset selection
    selectedMeshes.clear();
    originalMaterials.forEach((material, mesh) => {
      mesh.material = material;
    });
    originalMaterials.clear();
  });
  advancedTexture.addControl(button);

  return () => {
    // Cleanup function
    scene.onPointerObservable.clear();
    advancedTexture.dispose();
  };
}

export default enableMultipleObjectSelection;