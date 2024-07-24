import * as BABYLON from 'babylonjs';

function enableFaceSelection(scene, onFaceSelected) {
  let highlightMesh = null;

  scene.onPointerMove = function (evt, pickResult) {
    if (pickResult.hit && pickResult.pickedMesh) {
      const faceId = pickResult.faceId;
      if (faceId !== -1) {
        if (highlightMesh) {
          highlightMesh.dispose();
        }

        const positions = pickResult.pickedMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = pickResult.pickedMesh.getIndices();
        const facePositions = [
          positions[indices[faceId * 3] * 3], positions[indices[faceId * 3] * 3 + 1], positions[indices[faceId * 3] * 3 + 2],
          positions[indices[faceId * 3 + 1] * 3], positions[indices[faceId * 3 + 1] * 3 + 1], positions[indices[faceId * 3 + 1] * 3 + 2],
          positions[indices[faceId * 3 + 2] * 3], positions[indices[faceId * 3 + 2] * 3 + 1], positions[indices[faceId * 3 + 2] * 3 + 2]
        ];

        highlightMesh = BABYLON.MeshBuilder.CreatePolygon("highlight", {shape: facePositions, updatable: true}, scene);
        highlightMesh.position = pickResult.pickedMesh.position;
        highlightMesh.rotation = pickResult.pickedMesh.rotation;
        highlightMesh.scaling = pickResult.pickedMesh.scaling;

        const highlightMaterial = new BABYLON.StandardMaterial("highlightMaterial", scene);
        highlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
        highlightMaterial.alpha = 0.3;
        highlightMesh.material = highlightMaterial;
      }
    } else if (highlightMesh) {
      highlightMesh.dispose();
      highlightMesh = null;
    }
  };

  scene.onPointerPick = function (evt, pickResult) {
    if (pickResult.hit && pickResult.pickedMesh && pickResult.faceId !== -1) {
      onFaceSelected(pickResult.pickedMesh, pickResult.faceId);
    }
  };
}

export default enableFaceSelection;