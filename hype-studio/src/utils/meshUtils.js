import { 
    Vector3, MeshBuilder, StandardMaterial, Color3, HighlightLayer, TransformNode
  } from '@babylonjs/core';
  
  let highlightLayer;
  
  export const manageSketchMesh = (scene, sketch, existingMesh = null) => {
    try {
      const points = sketch.geometry.map(point => new Vector3(point.x, point.y, 0));
      let lines;
      if (existingMesh) {
        lines = MeshBuilder.CreateLines("sketch", { points: points, instance: existingMesh });
      } else {
        lines = MeshBuilder.CreateLines("sketch", { points: points, updatable: true }, scene);
        lines.color = new Color3(0, 0, 1); // Blue color for sketches
      }
      lines.name = `sketch_${sketch.id}`;
      return lines;
    } catch (error) {
      console.error(`Error managing sketch mesh: ${error.message}`);
      return null;
    }
  };
  
  export const manageExtrusionMesh = (scene, extrusion, sketchGeometry, customProperties, existingNode = null) => {
    try {
      const extrusionNode = existingNode || new TransformNode(`extrusionNode_${extrusion.id}`, scene);
      extrusionNode.name = `extrusion_${extrusion.id}`;
  
      // Sketch lines (child of extrusionNode)
      const lines = manageSketchMesh(scene, { id: extrusion.id, geometry: sketchGeometry }, extrusionNode.getChildMeshes(false)[0]);
      lines.parent = extrusionNode;
  
      // Extruded shape (child of extrusionNode)
      const shape = sketchGeometry.map(point => new Vector3(point.x, point.y, 0));
      const path = [new Vector3(0, 0, 0), new Vector3(0, 0, extrusion.depth)];
      
      let extrudeMesh;
      if (extrusionNode.getChildMeshes(false)[1]) {
        extrudeMesh = MeshBuilder.ExtrudeShape("extrusion", {
          shape: shape,
          path: path,
          instance: extrusionNode.getChildMeshes(false)[1]
        });
      } else {
        extrudeMesh = MeshBuilder.ExtrudeShape("extrusion", {
          shape: shape,
          path: path,
          updatable: true
        }, scene);
        extrudeMesh.parent = extrusionNode;
      }
      extrudeMesh.name = `extrudedMesh_${extrusion.id}`;
  
      applyCustomProperties(extrudeMesh, customProperties, scene);
      return extrusionNode;
    } catch (error) {
      console.error(`Error managing extrusion mesh: ${error.message}`);
      return null;
    }
  };
  
  const applyCustomProperties = (mesh, customProperties, scene) => {
    if (customProperties?.material) {
      const material = new StandardMaterial("customMaterial", scene);
      material.diffuseColor = new Color3(...customProperties.material);
      mesh.material = material;
    }
    // Apply other custom properties as needed
  };
  
  export const highlightMesh = (scene, mesh) => {
    if (!highlightLayer) {
      highlightLayer = new HighlightLayer("highlightLayer", scene);
    }
    highlightLayer.addMesh(mesh, Color3.Yellow());
  };
  
  export const unhighlightMesh = (mesh) => {
    if (highlightLayer) {
      highlightLayer.removeMesh(mesh);
    }
  };
  
  export const manageElementMesh = (scene, element, elementType, existingNode = null, customProperties = null) => {
    switch (elementType) {
      case 'sketches':
        return manageSketchMesh(scene, element, existingNode);
      case 'extrusions':
        const sketch = scene.getSketchById(element.baseSketchId); // You'll need to implement this method
        return manageExtrusionMesh(scene, element, sketch.geometry, customProperties, existingNode);
      // Add cases for other element types
      default:
        console.error(`Unknown element type: ${elementType}`);
        return null;
    }
  };
  
  export const disposeMesh = (mesh) => {
    if (mesh) {
      if (mesh instanceof TransformNode) {
        mesh.getChildMeshes().forEach(childMesh => {
          if (childMesh.material) {
            childMesh.material.dispose();
          }
          childMesh.dispose();
        });
      } else if (mesh.material) {
        mesh.material.dispose();
      }
      mesh.dispose();
    }
  };
  
  export const updateMeshVisibility = (mesh, isVisible) => {
    if (mesh) {
      if (mesh instanceof TransformNode) {
        mesh.getChildMeshes().forEach(childMesh => {
          childMesh.isVisible = isVisible;
        });
      } else {
        mesh.isVisible = isVisible;
      }
    }
  };
  
  export const getSketchFromScene = (scene, sketchId) => {
    return scene.getMeshByName(`sketch_${sketchId}`);
  };
  
  export const getExtrusionFromScene = (scene, extrusionId) => {
    return scene.getTransformNodeByName(`extrusion_${extrusionId}`);
  };

  export const startDragOperation = (scene, dragCallback, endCallback) => {
    let dragging = false;
  
    const onPointerMove = (evt) => {
      if (!dragging) return;
      const pickResult = scene.pick(evt.x, evt.y);
      if (pickResult.hit) {
        dragCallback(pickResult.pickedPoint);
      }
    };
  
    const onPointerUp = () => {
      dragging = false;
      scene.onPointerMove = null;
      scene.onPointerUp = null;
      if (endCallback) endCallback();
    };
  
    const onPointerDown = (evt) => {
      dragging = true;
      const pickResult = scene.pick(evt.x, evt.y);
      if (pickResult.hit) {
        dragCallback(pickResult.pickedPoint);
      }
    };
  
    scene.onPointerDown = onPointerDown;
    scene.onPointerMove = onPointerMove;
    scene.onPointerUp = onPointerUp;
  
    return () => {
      // Cleanup function
      scene.onPointerDown = null;
      scene.onPointerMove = null;
      scene.onPointerUp = null;
    };
  };
  
  export const findClosestPointIndex = (points, pickedPoint) => {
    let closestIndex = -1;
    let minDistance = Infinity;
    points.forEach((point, index) => {
      const distance = Vector3.Distance(
        new Vector3(point.x, point.y, 0),
        new Vector3(pickedPoint.x, pickedPoint.y, pickedPoint.z)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };