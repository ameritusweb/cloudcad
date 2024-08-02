// src/utils/meshUtils.js

import { 
    Vector3, MeshBuilder, StandardMaterial, VertexBuffer, Mesh, Color3, HighlightLayer, TransformNode
  } from '@babylonjs/core';
  
  let highlightLayer;

  const EDGE_THRESHOLD = 0.01;
const FACE_NORMAL_THRESHOLD = 0.9;

export function selectEdge(mesh, pickResult) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  
  for (let i = 0; i < indices.length; i += 3) {
    const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
    const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
    const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

    if (Vector3.DistanceSquared(pickResult.pickedPoint, v1) < 0.01 ||
        Vector3.DistanceSquared(pickResult.pickedPoint, v2) < 0.01 ||
        Vector3.DistanceSquared(pickResult.pickedPoint, v3) < 0.01) {
      return i / 3;  // Return the index of the triangle
    }
  }

  return -1;  // No edge found
}

export function selectFace(mesh, pickResult) {
  return pickResult.faceId;  // js provides the face index directly
}

export function highlightEdge(mesh, edgeIndex) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();

  const v1 = new Vector3(positions[indices[edgeIndex * 3] * 3], positions[indices[edgeIndex * 3] * 3 + 1], positions[indices[edgeIndex * 3] * 3 + 2]);
  const v2 = new Vector3(positions[indices[edgeIndex * 3 + 1] * 3], positions[indices[edgeIndex * 3 + 1] * 3 + 1], positions[indices[edgeIndex * 3 + 1] * 3 + 2]);
  const v3 = new Vector3(positions[indices[edgeIndex * 3 + 2] * 3], positions[indices[edgeIndex * 3 + 2] * 3 + 1], positions[indices[edgeIndex * 3 + 2] * 3 + 2]);

  const lines = [
    [v1, v2],
    [v2, v3],
    [v3, v1]
  ];

  const highlightMesh = MeshBuilder.CreateLineSystem("highlightEdge", { lines: lines }, mesh.getScene());
  highlightMesh.color = new Color3(1, 1, 0);  // Yellow highlight
  highlightMesh.parent = mesh;

  return highlightMesh;
}

export function highlightFace(mesh, faceIndex) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();

  const v1 = new Vector3(positions[indices[faceIndex * 3] * 3], positions[indices[faceIndex * 3] * 3 + 1], positions[indices[faceIndex * 3] * 3 + 2]);
  const v2 = new Vector3(positions[indices[faceIndex * 3 + 1] * 3], positions[indices[faceIndex * 3 + 1] * 3 + 1], positions[indices[faceIndex * 3 + 1] * 3 + 2]);
  const v3 = new Vector3(positions[indices[faceIndex * 3 + 2] * 3], positions[indices[faceIndex * 3 + 2] * 3 + 1], positions[indices[faceIndex * 3 + 2] * 3 + 2]);

  const highlightMesh = MeshBuilder.CreatePolygon("highlightFace", { shape: [v1, v2, v3] }, mesh.getScene());
  const highlightMaterial = new StandardMaterial("highlightMaterial", mesh.getScene());
  highlightMaterial.emissiveColor = new Color3(0, 1, 0);  // Green highlight
  highlightMaterial.alpha = 0.5;
  highlightMesh.material = highlightMaterial;
  highlightMesh.parent = mesh;

  return highlightMesh;
}

export function selectCylinderPart(mesh, pickResult) {
  if (mesh.shape !== 'cylinder') {
    return null;
  }

  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  const pickedPoint = pickResult.pickedPoint;

  // Check if we're close to the top or bottom face
  const topCenter = new Vector3(0, mesh.scaling.y / 2, 0).addInPlace(mesh.position);
  const bottomCenter = new Vector3(0, -mesh.scaling.y / 2, 0).addInPlace(mesh.position);
  
  if (Vector3.Distance(pickedPoint, topCenter) < mesh.scaling.x * 0.1) {
    return { type: 'face', part: 'top' };
  }
  
  if (Vector3.Distance(pickedPoint, bottomCenter) < mesh.scaling.x * 0.1) {
    return { type: 'face', part: 'bottom' };
  }

  // Check if we're close to the curved edge
  const radiusVector = new Vector3(pickedPoint.x - mesh.position.x, 0, pickedPoint.z - mesh.position.z);
  const distanceFromAxis = radiusVector.length();
  
  if (Math.abs(distanceFromAxis - mesh.scaling.x / 2) < 0.1) {
    return { type: 'edge', part: 'curved' };
  }

  // If we're here, we didn't select any specific part
  return null;
}

export function highlightCylinderPart(mesh, selection) {
  const scene = mesh.getScene();
  let highlightMesh;

  switch(selection.part) {
    case 'top':
    case 'bottom':
      const y = selection.part === 'top' ? mesh.scaling.y / 2 : -mesh.scaling.y / 2;
      highlightMesh = MeshBuilder.CreateDisc("highlightFace", { radius: mesh.scaling.x / 2, tessellation: 64 }, scene);
      highlightMesh.position.y = y;
      highlightMesh.rotation.x = Math.PI / 2;
      break;
    case 'curved':
      highlightMesh = MeshBuilder.CreateTorus("highlightEdge", { diameter: mesh.scaling.x, thickness: 0.05, tessellation: 64 }, scene);
      break;
  }

  if (highlightMesh) {
    const material = new StandardMaterial("highlightMaterial", scene);
    material.emissiveColor = selection.type === 'face' ? new Color3(0, 1, 0) : new Color3(1, 1, 0);
    material.alpha = 0.5;
    highlightMesh.material = material;
    highlightMesh.parent = mesh;
  }

  return highlightMesh;
}

export function selectMeshPart(mesh, pickResult) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
  const pickedPoint = pickResult.pickedPoint;
  const pickedNormal = pickResult.getNormal(true);

  let closestEdge = null;
  let closestEdgeDistance = Infinity;
  let closestFace = null;
  let maxFaceAlignment = -1;

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = Vector3.FromArray(positions, indices[i] * 3);
    const v2 = Vector3.FromArray(positions, indices[i + 1] * 3);
    const v3 = Vector3.FromArray(positions, indices[i + 2] * 3);

    // Check edges
    const edges = [[v1, v2], [v2, v3], [v3, v1]];
    edges.forEach(([start, end]) => {
      const edgeVector = end.subtract(start);
      const t = Vector3.Dot(pickedPoint.subtract(start), edgeVector) / edgeVector.lengthSquared();
      if (t >= 0 && t <= 1) {
        const projection = start.add(edgeVector.scale(t));
        const distance = Vector3.Distance(pickedPoint, projection);
        if (distance < closestEdgeDistance) {
          closestEdgeDistance = distance;
          closestEdge = { start, end };
        }
      }
    });

    // Check face
    const faceNormal = Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).normalize();
    const alignment = Vector3.Dot(faceNormal, pickedNormal);
    if (alignment > maxFaceAlignment) {
      maxFaceAlignment = alignment;
      closestFace = { v1, v2, v3, normal: faceNormal };
    }
  }

  if (closestEdgeDistance < EDGE_THRESHOLD) {
    return { type: 'edge', data: closestEdge };
  } else if (maxFaceAlignment > FACE_NORMAL_THRESHOLD) {
    return { type: 'face', data: closestFace };
  } else {
    return { type: 'mesh', data: mesh };
  }
}

export function highlightMeshPart(mesh, selection) {
  const scene = mesh.getScene();
  let highlightMesh;

  switch (selection.type) {
    case 'edge':
      const { start, end } = selection.data;
      highlightMesh = MeshBuilder.CreateLines("highlightEdge", { points: [start, end] }, scene);
      highlightMesh.color = new Color3(1, 1, 0); // Yellow for edges
      break;
    case 'face':
      const { v1, v2, v3 } = selection.data;
      highlightMesh = MeshBuilder.CreatePolygon("highlightFace", { shape: [v1, v2, v3], sideOrientation: Mesh.DOUBLESIDE }, scene);
      const material = new StandardMaterial("highlightMaterial", scene);
      material.emissiveColor = new Color3(0, 1, 0); // Green for faces
      material.alpha = 0.5;
      highlightMesh.material = material;
      break;
    case 'mesh':
      // For full mesh selection, we could create a bounding box or just return null
      return null;
  }

  if (highlightMesh) {
    highlightMesh.parent = mesh;
  }

  return highlightMesh;
}

  const manageSplineSketchMesh = (scene, sketch, existingMesh = null) => {
    const points = [];
    
    // Use a simple quadratic Bezier curve for demonstration purposes
    for (let t = 0; t <= 1; t += 0.01) {
      const x = (1 - t) * (1 - t) * sketch.start.x + 2 * (1 - t) * t * sketch.control.x + t * t * sketch.end.x;
      const y = (1 - t) * (1 - t) * sketch.start.y + 2 * (1 - t) * t * sketch.control.y + t * t * sketch.end.y;
      points.push(new Vector3(x, y, 0));
    }
    
    let mesh;
    if (existingMesh) {
      mesh = MeshBuilder.CreateLines("spline", { points: points, instance: existingMesh });
    } else {
      mesh = MeshBuilder.CreateLines("spline", { points: points, updatable: true }, scene);
      mesh.color = new Color3(0, 0, 1); // Blue color for sketches
    }
    
    return mesh;
  };

  const manageArcSketchMesh = (scene, sketch, existingMesh = null) => {
    const points = [];
    const step = (sketch.endAngle - sketch.startAngle) / 64;
    
    for (let i = sketch.startAngle; i <= sketch.endAngle; i += step) {
      points.push(new Vector3(
        sketch.center.x + sketch.radius * Math.cos(i),
        sketch.center.y + sketch.radius * Math.sin(i),
        0
      ));
    }
    
    let mesh;
    if (existingMesh) {
      mesh = MeshBuilder.CreateLines("arc", { points: points, instance: existingMesh });
    } else {
      mesh = MeshBuilder.CreateLines("arc", { points: points, updatable: true }, scene);
      mesh.color = new Color3(0, 0, 1); // Blue color for sketches
    }
    
    return mesh;
  };

  const manageLineSketchMesh = (scene, sketch, existingMesh = null) => {
    const points = [
      new Vector3(sketch.start.x, sketch.start.y, 0),
      new Vector3(sketch.end.x, sketch.end.y, 0)
    ];
    
    let mesh;
    if (existingMesh) {
      mesh = MeshBuilder.CreateLines("line", { points: points, instance: existingMesh });
    } else {
      mesh = MeshBuilder.CreateLines("line", { points: points, updatable: true }, scene);
      mesh.color = new Color3(0, 0, 1); // Blue color for sketches
    }
    
    return mesh;
  };

  const managePolygonSketchMesh = (scene, sketch, existingMesh = null) => {
    const options = {
      shape: sketch.points.map(point => new Vector3(point.x, point.y, 0)),
      updatable: true
    };
    
    let mesh;
    if (existingMesh) {
      existingMesh.dispose();
      mesh = MeshBuilder.CreatePolygon("polygon", options, scene);
    } else {
      mesh = MeshBuilder.CreatePolygon("polygon", options, scene);
    }
    
    mesh.position = new Vector3(0, 0, 0);
    
    const material = new StandardMaterial("polygonMaterial", scene);
    material.diffuseColor = new Color3(0, 0, 1); // Blue color for sketches
    material.wireframe = true;
    mesh.material = material;
    
    return mesh;
  };

  const manageEllipseSketchMesh = (scene, sketch, existingMesh = null) => {
    const options = {
      diameterX: sketch.radiusX * 2,
      diameterY: sketch.radiusY * 2,
      tessellation: 64
    };
    
    let mesh;
    if (existingMesh) {
      existingMesh.dispose();
      mesh = MeshBuilder.CreateDisc("ellipse", options, scene);
    } else {
      mesh = MeshBuilder.CreateDisc("ellipse", options, scene);
    }
    
    mesh.position = new Vector3(sketch.center.x, sketch.center.y, 0);
    mesh.rotation.x = Math.PI / 2; // Rotate to lie flat on the XY plane
    
    const material = new StandardMaterial("ellipseMaterial", scene);
    material.diffuseColor = new Color3(0, 0, 1); // Blue color for sketches
    material.wireframe = true;
    mesh.material = material;
    
    return mesh;
  };
  
  const manageCircleSketchMesh = (scene, sketch, existingMesh = null) => {
    const options = {
      diameter: sketch.radius * 2,
      thickness: 0.01,
      tessellation: 64
    };
    
    let mesh;
    if (existingMesh) {
      mesh = MeshBuilder.CreateTorus("circle", options, scene);
      existingMesh.dispose();
    } else {
      mesh = MeshBuilder.CreateTorus("circle", options, scene);
    }
    
    mesh.position = new Vector3(sketch.center.x, sketch.center.y, 0);
    mesh.rotation.x = Math.PI / 2; // Rotate to lie flat on the XY plane
    
    const material = new StandardMaterial("circleMaterial", scene);
    material.diffuseColor = new Color3(0, 0, 1); // Blue color for sketches
    material.wireframe = true;
    mesh.material = material;
    
    return mesh;
  };

  const manageRectangleSketchMesh = (scene, sketch, existingMesh = null) => {
    const options = {
      width: sketch.width,
      height: sketch.height,
      updatable: true
    };
    
    let mesh;
    if (existingMesh) {
      mesh = MeshBuilder.CreatePlane("rectangle", options, scene);
      existingMesh.dispose();
    } else {
      mesh = MeshBuilder.CreatePlane("rectangle", options, scene);
    }
    
    mesh.position = new Vector3(sketch.center.x, sketch.center.y, 0);
    
    const material = new StandardMaterial("rectangleMaterial", scene);
    material.diffuseColor = new Color3(0, 0, 1); // Blue color for sketches
    material.wireframe = true;
    mesh.material = material;
    
    return mesh;
  };

  export const createSketchMesh = (scene, sketch) => {
    return manageSketchMesh(scene, sketch);
  };

  export const createExtrusionMesh = (scene, extrusion, baseSketch) => {
    return manageExtrusionMesh(scene, extrusion, baseSketch.geometry, extrusion.customProperties);
  };

  export const manageSketchMesh = (scene, sketch, existingMesh = null) => {
  try {
    let mesh;
    switch (sketch.type) {
      case 'circle':
        mesh = manageCircleSketchMesh(scene, sketch, existingMesh);
        break;
      case 'rectangle':
        mesh = manageRectangleSketchMesh(scene, sketch, existingMesh);
        break;
      case 'ellipse':
        mesh = manageEllipseSketchMesh(scene, sketch, existingMesh);
        break;
      case 'polygon':
        mesh = managePolygonSketchMesh(scene, sketch, existingMesh);
        break;
      case 'line':
        mesh = manageLineSketchMesh(scene, sketch, existingMesh);
        break;
      case 'arc':
        mesh = manageArcSketchMesh(scene, sketch, existingMesh);
        break;
      case 'spline':
        mesh = manageSplineSketchMesh(scene, sketch, existingMesh);
        break;
      default:
        const points = sketch.geometry.map(point => new Vector3(point.x, point.y, 0));
        if (existingMesh) {
          mesh = MeshBuilder.CreateLines("sketch", { points: points, instance: existingMesh });
        } else {
          mesh = MeshBuilder.CreateLines("sketch", { points: points, updatable: true }, scene);
          mesh.color = new Color3(0, 0, 1); // Blue color for sketches
        }
    }
    mesh.name = `sketch_${sketch.id}`;
    return mesh;
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
      return createSketchMesh(scene, element);
    case 'extrusions':
      const baseSketch = scene.getSketchById(element.baseSketchId);
      return createExtrusionMesh(scene, element, baseSketch);
      // Add cases for other element types
      default:
        console.error(`Unknown element type: ${elementType}`);
        return null;
    }
  };

  export const clearMeshes = (meshes) => {
    Object.values(meshes).forEach(mesh => disposeMesh(mesh));
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