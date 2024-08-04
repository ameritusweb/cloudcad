import { 
    Vector3, MeshBuilder, StandardMaterial, Quaternion, VertexBuffer, Mesh, Color3, HighlightLayer, TransformNode
  } from '@babylonjs/core';
import earcut from 'earcut';

const EDGE_THRESHOLD = 0.01;
const FACE_NORMAL_THRESHOLD = 0.9;

// Utility function to create a unique key for an edge
const getEdgeKey = (v1Index, v2Index) => {
  return v1Index < v2Index ? `${v1Index}-${v2Index}` : `${v2Index}-${v1Index}`;
};

// Function to select an edge based on a pick result
export function selectEdge(mesh, pickResult) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  
  for (let i = 0; i < indices.length; i += 3) {
    const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
    const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
    const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

    if (Vector3.DistanceSquared(pickResult.pickedPoint, v1) < EDGE_THRESHOLD ||
        Vector3.DistanceSquared(pickResult.pickedPoint, v2) < EDGE_THRESHOLD ||
        Vector3.DistanceSquared(pickResult.pickedPoint, v3) < EDGE_THRESHOLD) {
      return i / 3;  // Return the index of the triangle
    }
  }

  return -1;  // No edge found
}

// Function to select a face based on a pick result
export function selectFace(mesh, pickResult) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const indices = mesh.getIndices();
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    const faceId = pickResult.faceId;
  
    if (faceId >= 0) {
      const selectedNormal = new Vector3(
        normals[indices[faceId * 3] * 3],
        normals[indices[faceId * 3] * 3 + 1],
        normals[indices[faceId * 3] * 3 + 2]
      );
  
      let faceVertices = new Set();
      for (let i = 0; i < indices.length; i += 3) {
        const normal = new Vector3(
          normals[indices[i] * 3],
          normals[indices[i] * 3 + 1],
          normals[indices[i] * 3 + 2]
        );
  
        if (normal.equalsWithEpsilon(selectedNormal, 0.01)) {
          for (let j = 0; j < 3; j++) {
            const vertexIndex = indices[i + j];
            faceVertices.add(vertexIndex);
          }
        }
      }
  
      const worldMatrix = mesh.getWorldMatrix();
      const vertices = Array.from(faceVertices).map(index => {
        const vertex = new Vector3(
          positions[index * 3],
          positions[index * 3 + 1],
          positions[index * 3 + 2]
        );
        const worldVertex = Vector3.TransformCoordinates(vertex, worldMatrix);
        return { x: worldVertex.x, y: worldVertex.y, z: worldVertex.z };
      });
  
      const worldNormal = Vector3.TransformNormal(selectedNormal, worldMatrix);
  
      return {
        faceId: faceId,
        normal: { x: worldNormal.x, y: worldNormal.y, z: worldNormal.z },
        vertices: vertices
      };
    }
  
    return null;
  }

// Function to highlight an edge based on its index
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

// Function to highlight a face based on its index
export function highlightFace(mesh, faceData) {
    mesh.material.alpha = 0.5;
    const { vertices, normal } = faceData;
  
  // Calculate the center of the face
   // Calculate the center of the face
   const center = vertices.reduce((acc, vertex) => {
    return acc.add(new Vector3(vertex.x, vertex.y, vertex.z).clone()); // Clone before adding
}, new Vector3()); // Start with a fresh Vector3 
center.scaleInPlace(1 / vertices.length);

  // Create a disc to represent the circular face
  const radius = Math.max(...vertices.map(v => 
    Vector3.Distance(new Vector3(v.x, v.y, v.z), center)
  ));
  const highlightMesh = MeshBuilder.CreateDisc("highlightFace", { radius: radius, tessellation: 64 }, mesh.getScene());
  
  // Position and orient the highlight mesh
  highlightMesh.position = center;
  // Orient the highlight mesh
  const normalVector = new Vector3(normal.x, normal.y, normal.z);
  
 // Calculate rotation from initial (0, 0, 1) to face normal
 const rotationAxis = Vector3.Cross(Vector3.Forward(), normalVector); 
 const rotationAngle = Math.acos(Vector3.Dot(Vector3.Forward(), normalVector));
 const rotationQuaternion = Quaternion.RotationAxis(rotationAxis, rotationAngle);
 highlightMesh.rotationQuaternion = rotationQuaternion;

  // Move the highlight slightly above the face to prevent z-fighting
  highlightMesh.position.addInPlace(new Vector3(normal.x, normal.y, normal.z).scale(0.01));

  const highlightMaterial = new StandardMaterial("highlightMaterial", mesh.getScene());
  highlightMaterial.emissiveColor = new Color3(0, 1, 0);  // Green highlight
  highlightMaterial.alpha = 0.5;
  highlightMaterial.backFaceCulling = false;
  highlightMesh.material = highlightMaterial;

  highlightMesh.renderingGroupId = 1;
  mesh.getScene().setRenderingAutoClearDepthStencil(1, false);

  return highlightMesh;
}

// Function to select a specific part of a cylinder
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

// Function to highlight a specific part of a cylinder
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

// Function to select a mesh part (edge, face, or mesh) based on a pick result
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
      const v1s = { x: v1.x, y: v1.y, z: v1.z };
      const v2s = { x: v2.x, y: v2.y, z: v2.z };
      const v3s = { x: v3.x, y: v3.y, z: v3.z };
      const faceNormals = { x: faceNormal.x, y: faceNormal.y, z: faceNormal.z };
      closestFace = { v1s, v2s, v3s, normal: faceNormals };
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

// Function to highlight a selected mesh part (edge, face, or mesh)
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