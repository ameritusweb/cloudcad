import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as BABYLON from 'babylonjs';

const CircularCutControls = ({ scene, onOperationComplete }) => {
  const [objectId, setObjectId] = useState('');
  const [faceSelector, setFaceSelector] = useState('');
  const [circleDiameter, setCircleDiameter] = useState(1);
  const [cutDepth, setCutDepth] = useState(1);
  const [previewMesh, setPreviewMesh] = useState(null);

  useEffect(() => {
    return () => {
      if (previewMesh) {
        previewMesh.dispose();
      }
    };
  }, []);

  const updatePreview = () => {
    if (previewMesh) {
      previewMesh.dispose();
    }

    const selectedObject = scene.getMeshByID(objectId);
    if (!selectedObject) return;

    const face = selectedObject.getFacetByNormal(BABYLON.Vector3.Up());
    if (!face) return;

    const previewCircle = BABYLON.MeshBuilder.CreateTorus("previewCircle", {
      diameter: circleDiameter,
      thickness: 0.1,
      tessellation: 64
    }, scene);

    previewCircle.position = face.centroids[0];
    previewCircle.rotation = face.normals[0].toQuaternion();

    const previewMaterial = new BABYLON.StandardMaterial("previewMaterial", scene);
    previewMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    previewMaterial.alpha = 0.5;
    previewCircle.material = previewMaterial;

    setPreviewMesh(previewCircle);
  };

  useEffect(() => {
    updatePreview();
  }, [objectId, faceSelector, circleDiameter, cutDepth]);

  const handleCircularCut = async () => {
    try {
      const response = await axios.post('/api/circular_cut', {
        objectId,
        faceSelector,
        circleDiameter,
        cutDepth
      });

      if (response.data.success) {
        onOperationComplete(response.data.updatedModel);
      } else {
        console.error('Failed to perform circular cut:', response.data.error);
      }
    } catch (error) {
      console.error('Error performing circular cut:', error);
    }
  };

  return (
    <div>
      <h3>Circular Cut</h3>
      <input
        type="text"
        placeholder="Object ID"
        value={objectId}
        onChange={(e) => setObjectId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Face Selector (e.g., '>Z')"
        value={faceSelector}
        onChange={(e) => setFaceSelector(e.target.value)}
      />
      <input
        type="number"
        placeholder="Circle Diameter"
        value={circleDiameter}
        onChange={(e) => setCircleDiameter(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Cut Depth"
        value={cutDepth}
        onChange={(e) => setCutDepth(parseFloat(e.target.value))}
      />
      <button onClick={handleCircularCut}>Apply Circular Cut</button>
    </div>
  );
};

export default CircularCutControls;