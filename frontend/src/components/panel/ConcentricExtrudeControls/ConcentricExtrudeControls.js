import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as BABYLON from 'babylonjs';

const ConcentricExtrudeControls = ({ scene, onOperationComplete }) => {
  const [objectId, setObjectId] = useState('');
  const [faceSelector, setFaceSelector] = useState('');
  const [outerDiameter, setOuterDiameter] = useState(10);
  const [innerDiameter, setInnerDiameter] = useState(5);
  const [extrudeHeight, setExtrudeHeight] = useState(1);
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

    const outerCircle = BABYLON.MeshBuilder.CreateTorus("outerCircle", {
      diameter: outerDiameter,
      thickness: 0.1,
      tessellation: 64
    }, scene);

    const innerCircle = BABYLON.MeshBuilder.CreateTorus("innerCircle", {
      diameter: innerDiameter,
      thickness: 0.1,
      tessellation: 64
    }, scene);

    const previewGroup = new BABYLON.Mesh("previewGroup");
    outerCircle.parent = previewGroup;
    innerCircle.parent = previewGroup;

    previewGroup.position = face.centroids[0];
    previewGroup.rotation = face.normals[0].toQuaternion();

    const previewMaterial = new BABYLON.StandardMaterial("previewMaterial", scene);
    previewMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    previewMaterial.alpha = 0.5;
    outerCircle.material = previewMaterial;
    innerCircle.material = previewMaterial;

    setPreviewMesh(previewGroup);
  };

  useEffect(() => {
    updatePreview();
  }, [objectId, faceSelector, outerDiameter, innerDiameter, extrudeHeight]);

  const handleConcentricExtrude = async () => {
    try {
      const response = await axios.post('/api/concentric_extrude', {
        objectId,
        faceSelector,
        outerDiameter,
        innerDiameter,
        extrudeHeight
      });

      if (response.data.success) {
        onOperationComplete(response.data.updatedModel);
      } else {
        console.error('Failed to perform concentric extrude:', response.data.error);
      }
    } catch (error) {
      console.error('Error performing concentric extrude:', error);
    }
  };

  return (
    <div>
      <h3>Concentric Circles Extrude</h3>
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
        placeholder="Outer Diameter"
        value={outerDiameter}
        onChange={(e) => setOuterDiameter(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Inner Diameter"
        value={innerDiameter}
        onChange={(e) => setInnerDiameter(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Extrude Height"
        value={extrudeHeight}
        onChange={(e) => setExtrudeHeight(parseFloat(e.target.value))}
      />
      <button onClick={handleConcentricExtrude}>Apply Concentric Extrude</button>
    </div>
  );
};

export default ConcentricExtrudeControls;