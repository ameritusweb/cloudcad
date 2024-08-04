import { 
  Vector3, MeshBuilder, StandardMaterial, VertexBuffer, Mesh, Color3, HighlightLayer, TransformNode
} from '@babylonjs/core';

let highlightLayer;

// Function to manage spline sketch meshes
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

// Function to manage arc sketch meshes
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

// Function to manage line sketch meshes
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

// Function to manage polygon sketch meshes
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

// Function to manage ellipse sketch meshes
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

// Function to manage circle sketch meshes
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

// Function to manage rectangle sketch meshes
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

// Exported function to create a sketch mesh
export const createSketchMesh = (scene, sketch) => {
  return manageSketchMesh(scene, sketch);
};

// Exported function to create an extrusion mesh
export const createExtrusionMesh = (scene, extrusion, baseSketch) => {
  return manageExtrusionMesh(scene, extrusion, baseSketch.geometry, extrusion.customProperties);
};

// Exported function to manage a sketch mesh
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

// Function to manage an extrusion mesh
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

// Function to apply custom properties to a mesh
const applyCustomProperties = (mesh, customProperties, scene) => {
  if (customProperties?.material) {
    const material = new StandardMaterial("customMaterial", scene);
    material.diffuseColor = new Color3(...customProperties.material);
    mesh.material = material;
  }
  // Apply other custom properties as needed
};

// Function to highlight a mesh
export const highlightMesh = (scene, mesh) => {
  if (!highlightLayer) {
    highlightLayer = new HighlightLayer("highlightLayer", scene);
  }
  highlightLayer.addMesh(mesh, Color3.Yellow());
};

// Function to unhighlight a mesh
export const unhighlightMesh = (mesh) => {
  if (highlightLayer) {
    highlightLayer.removeMesh(mesh);
  }
};

// Function to manage an element mesh
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

// Function to clear all meshes
export const clearMeshes = (meshes) => {
  Object.values(meshes).forEach(mesh => disposeMesh(mesh));
};

// Function to dispose of a mesh
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

// Function to update mesh visibility
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

// Function to get a sketch from the scene by ID
export const getSketchFromScene = (scene, sketchId) => {
  return scene.getMeshByName(`sketch_${sketchId}`);
};

// Function to get an extrusion from the scene by ID
export const getExtrusionFromScene = (scene, extrusionId) => {
  return scene.getTransformNodeByName(`extrusion_${extrusionId}`);
};

// Function to start a drag operation
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

// Function to find the closest point index from an array of points
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
