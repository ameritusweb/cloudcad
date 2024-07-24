import React, { useState, useEffect } from 'react';
import * as BABYLON from 'babylonjs';

const MirrorPlaneSelector = ({ scene, onPlaneSelected }) => {
  const [planeType, setPlaneType] = useState('face');
  const [customPlane, setCustomPlane] = useState({ origin: [0, 0, 0], normal: [0, 1, 0] });

  useEffect(() => {
    if (planeType === 'face') {
      enableFaceSelection(scene, (mesh, faceId) => {
        const normal = mesh.getFacetNormal(faceId);
        const origin = mesh.getFacetPosition(faceId);
        onPlaneSelected({ origin: origin.asArray(), normal: normal.asArray() });
      });
    } else if (planeType === 'custom') {
      // Add visual helpers for custom plane definition
      const originSphere = BABYLON.MeshBuilder.CreateSphere("originSphere", { diameter: 0.1 }, scene);
      const normalLine = BABYLON.MeshBuilder.CreateLines("normalLine", {
        points: [
          new BABYLON.Vector3(...customPlane.origin),
          new BABYLON.Vector3(
            customPlane.origin[0] + customPlane.normal[0],
            customPlane.origin[1] + customPlane.normal[1],
            customPlane.origin[2] + customPlane.normal[2]
          )
        ]
      }, scene);

      return () => {
        originSphere.dispose();
        normalLine.dispose();
      };
    }
  }, [planeType, customPlane, scene, onPlaneSelected]);

  const handlePlaneTypeChange = (e) => {
    setPlaneType(e.target.value);
  };

  const handleCustomPlaneChange = (type, index, value) => {
    setCustomPlane(prev => {
      const newPlane = { ...prev };
      newPlane[type][index] = parseFloat(value);
      return newPlane;
    });
  };

  const handleCustomPlaneSubmit = () => {
    onPlaneSelected(customPlane);
  };

  return (
    <div>
      <select value={planeType} onChange={handlePlaneTypeChange}>
        <option value="face">Select Face</option>
        <option value="custom">Custom Plane</option>
      </select>
      {planeType === 'custom' && (
        <div>
          <div>
            Origin: 
            <input type="number" value={customPlane.origin[0]} onChange={(e) => handleCustomPlaneChange('origin', 0, e.target.value)} />
            <input type="number" value={customPlane.origin[1]} onChange={(e) => handleCustomPlaneChange('origin', 1, e.target.value)} />
            <input type="number" value={customPlane.origin[2]} onChange={(e) => handleCustomPlaneChange('origin', 2, e.target.value)} />
          </div>
          <div>
            Normal: 
            <input type="number" value={customPlane.normal[0]} onChange={(e) => handleCustomPlaneChange('normal', 0, e.target.value)} />
            <input type="number" value={customPlane.normal[1]} onChange={(e) => handleCustomPlaneChange('normal', 1, e.target.value)} />
            <input type="number" value={customPlane.normal[2]} onChange={(e) => handleCustomPlaneChange('normal', 2, e.target.value)} />
          </div>
          <button onClick={handleCustomPlaneSubmit}>Set Custom Plane</button>
        </div>
      )}
    </div>
  );
};

export default MirrorPlaneSelector;