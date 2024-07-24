import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

const EnhancedMirrorPreview = ({ scene, mirrorType, mirrorPlane, objects, keepOriginal, alignToAxis }) => {
  const previewMeshesRef = useRef([]);
  const mirrorPlaneVisualizationRef = useRef(null);

  useEffect(() => {
    if (scene && mirrorPlane && objects.length > 0) {
      // Clear previous preview
      clearPreview();

      // Create mirror plane visualization
      const planeVisualization = BABYLON.MeshBuilder.CreatePlane("mirrorPlane", { size: 10 }, scene);
      planeVisualization.position = new BABYLON.Vector3(...mirrorPlane.origin);
      planeVisualization.lookAt(new BABYLON.Vector3(...mirrorPlane.normal).add(planeVisualization.position));
      const planeMaterial = new BABYLON.StandardMaterial("planeMaterial", scene);
      planeMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
      planeMaterial.alpha = 0.5;
      planeVisualization.material = planeMaterial;
      mirrorPlaneVisualizationRef.current = planeVisualization;

      // Create mirrored copies
      objects.forEach(obj => {
        const mirroredMesh = obj.clone("mirroredMesh");
        mirroredMesh.material = new BABYLON.StandardMaterial("previewMaterial", scene);
        mirroredMesh.material.diffuseColor = new BABYLON.Color3(0, 1, 1); // Cyan color for preview
        mirroredMesh.material.alpha = 0.5; // Semi-transparent

        // Apply mirroring transformation
        const mirrorMatrix = BABYLON.Matrix.ReflectionToRef(
          BABYLON.Plane.FromPositionAndNormal(
            new BABYLON.Vector3(...mirrorPlane.origin),
            new BABYLON.Vector3(...mirrorPlane.normal)
          ),
          new BABYLON.Matrix()
        );
        mirroredMesh.setPivotMatrix(mirrorMatrix);

        // Apply axis alignment if specified
        if (alignToAxis) {
          const alignmentMatrix = getAlignmentMatrix(alignToAxis);
          mirroredMesh.setPivotMatrix(mirroredMesh.getPivotMatrix().multiply(alignmentMatrix));
        }

        previewMeshesRef.current.push(mirroredMesh);
      });

      // If not keeping original, hide original objects
      if (!keepOriginal) {
        objects.forEach(obj => obj.setEnabled(false));
      }
    }

    return () => {
      clearPreview();
    };
  }, [scene, mirrorType, mirrorPlane, objects, keepOriginal, alignToAxis]);

  const clearPreview = () => {
    previewMeshesRef.current.forEach(mesh => mesh.dispose());
    previewMeshesRef.current = [];
    if (mirrorPlaneVisualizationRef.current) {
      mirrorPlaneVisualizationRef.current.dispose();
      mirrorPlaneVisualizationRef.current = null;
    }
    objects.forEach(obj => obj.setEnabled(true));
  };

  const getAlignmentMatrix = (axis) => {
    switch (axis) {
      case 'x':
        return BABYLON.Matrix.RotationY(Math.PI / 2);
      case 'y':
        return BABYLON.Matrix.RotationX(Math.PI / 2);
      case 'z':
        return BABYLON.Matrix.Identity();
      default:
        return BABYLON.Matrix.Identity();
    }
  };

  return null; // This component doesn't render anything directly
};

export default EnhancedMirrorPreview;