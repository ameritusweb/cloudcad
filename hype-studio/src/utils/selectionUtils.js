import { 
    Vector3, MeshBuilder, Color4, StandardMaterial, Quaternion, VertexBuffer, Mesh, Color3, HighlightLayer, TransformNode
  } from '@babylonjs/core';
import earcut from 'earcut';

const EDGE_THRESHOLD = 0.01;
const FACE_NORMAL_THRESHOLD = 0.9;

// Constants
const FLAT_ANGLE_THRESHOLD = 0.1; // (Radians) Controls flatness sensitivity

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

/**
 * Precompute adjacency list for efficient neighbor lookup.
 * @param {Mesh} mesh - The mesh to compute adjacency list for.
 * @returns {Object} An adjacency list mapping vertex indices to triangle indices.
 */
export function precomputeAdjacencyList(mesh) {
    const indices = mesh.getIndices();
    const adjacencyList = {};

    for (let i = 0; i < indices.length; i += 3) {
        const triangleVertices = indices.slice(i, i + 3);
        triangleVertices.forEach(vertexIndex => {
            adjacencyList[vertexIndex] = adjacencyList[vertexIndex] || [];
            triangleVertices.forEach(otherVertexIndex => {
                if (otherVertexIndex !== vertexIndex) {
                    adjacencyList[vertexIndex].push(i / 3); // Add triangle index
                }
            });
        });
    }

    return adjacencyList;
}

/**
 * Selects contiguous non-flat regions of a mesh.
 * @param {Mesh} mesh - The mesh to select from.
 * @param {PickingInfo} pickResult - The picking result.
 * @param {Array} adjacencyList - The pre-computed adjacency list.
 * @returns {Object|null} Selection data or null if no valid selection.
 */
export function selectMeshPart(mesh, pickResult, adjacencyList) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const indices = mesh.getIndices();

    // Ensure valid faceId
    if (pickResult.faceId === undefined || pickResult.faceId < 0) {
        return null;
    }

    const pickedTriangleIndex = Math.floor(pickResult.faceId / 3); // faceId is the index in the index array
    const selectedTriangles = [];
    const processedTriangles = new Set();

    floodFill(mesh, pickedTriangleIndex, selectedTriangles, processedTriangles, adjacencyList, true); // 'true' indicates the starting point

    return selectedTriangles.length > 0 ? { type: 'face', data: selectedTriangles } : null;
}

/**
 * Recursively selects connected, non-flat triangles.
 * @param {Mesh} mesh - The mesh to perform the flood fill on.
 * @param {number} triangleIndex - The index of the starting triangle.
 * @param {Array} selectedTriangles - The array to store selected triangles.
 * @param {Set} processedTriangles - The set of processed triangles.
 * @param {Array} adjacencyList - The pre-computed adjacency list.
 * @param {boolean} initial - Whether this is the initial triangle.
 */
function floodFill(mesh, triangleIndex, selectedTriangles, processedTriangles, adjacencyList, initial = false) {
    if (processedTriangles.has(triangleIndex)) {
        return; // Already processed this triangle
    }
    processedTriangles.add(triangleIndex);
    selectedTriangles.push(triangleIndex);

    const neighbors = getNeighboringTriangles(mesh, triangleIndex, adjacencyList);

    for (const neighbor of neighbors) {
        if (!processedTriangles.has(neighbor)) {
            if (initial || isConnected(mesh, triangleIndex, neighbor)) { 
                // Always include the initial triangle or directly connected neighbors
                floodFill(mesh, neighbor, selectedTriangles, processedTriangles, adjacencyList, false); 
            } else if (!isFlat(mesh, triangleIndex, neighbor)) { 
                // Start a new contiguous region if the neighbor isn't flat
                floodFill(mesh, neighbor, selectedTriangles, processedTriangles, adjacencyList, true); 
            }
        }
    }
}

/**
 * Get neighboring triangle indices using the adjacency list.
 * @param {Mesh} mesh - The mesh to find neighbors in.
 * @param {number} triangleIndex - The index of the triangle.
 * @param {Array} adjacencyList = The pre-computed adjacency list.
 * @returns {Array} An array of neighboring triangle indices.
 */
function getNeighboringTriangles(mesh, triangleIndex, adjacencyList) {
    const indices = mesh.getIndices();
    const triangleVertices = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);

    const neighbors = new Set();
    triangleVertices.forEach(vertexIndex => {
        if (adjacencyList[vertexIndex]) {
            adjacencyList[vertexIndex].forEach(neighborIndex => neighbors.add(neighborIndex));
        }
    });

    neighbors.delete(triangleIndex); // Remove the current triangle itself
    return Array.from(neighbors);
}

/**
 * Check if two triangles share a vertex (are connected).
 * @param {Mesh} mesh - The mesh containing the triangles.
 * @param {number} triangleIndex1 - The index of the first triangle.
 * @param {number} triangleIndex2 - The index of the second triangle.
 * @returns {boolean} True if the triangles are connected, otherwise false.
 */
function isConnected(mesh, triangleIndex1, triangleIndex2) {
    const indices = mesh.getIndices();
    const vertices1 = indices.slice(triangleIndex1 * 3, triangleIndex1 * 3 + 3);
    const vertices2 = indices.slice(triangleIndex2 * 3, triangleIndex2 * 3 + 3);
    return vertices1.some(vertex => vertices2.includes(vertex));
}

/**
 * Check if the angle between two triangle normals is below the flatness threshold.
 * @param {Mesh} mesh - The mesh containing the triangles.
 * @param {number} triangleIndex1 - The index of the first triangle.
 * @param {number} triangleIndex2 - The index of the second triangle.
 * @returns {boolean} True if the triangles are flat relative to each other.
 */
function isFlat(mesh, triangleIndex1, triangleIndex2) {
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    const indices = mesh.getIndices();

    const normal1 = Vector3.FromArray(normals, indices[triangleIndex1 * 3] * 3);
    const normal2 = Vector3.FromArray(normals, indices[triangleIndex2 * 3] * 3);

    // Calculate the angle between the normals directly
    const angle = Vector3.GetAngleBetweenVectors(normal1, normal2);

    return angle < FLAT_ANGLE_THRESHOLD; // Triangles are considered flat if the angle is below the threshold
}

/**
 * Highlights selected triangles by creating a polygon mesh.
 * @param {Mesh} mesh - The mesh to highlight a part in.
 * @param {Object} selection - The selection data.
 * @returns {Mesh|null} The highlight mesh or null if none.
 */
export function highlightMeshPart(mesh, selection) {
    mesh.material.alpha = 0.5;
    const scene = mesh.getScene();
    let highlightMesh;

    if (selection.type === 'face') {
        const { data: triangleIndices } = selection;
        const vertices = [];

        triangleIndices.forEach(triangleIndex => {
            const indices = mesh.getIndices().slice(triangleIndex * 3, triangleIndex * 3 + 3);
            indices.forEach(index => {
                const position = Vector3.FromArray(mesh.getVerticesData(VertexBuffer.PositionKind), index * 3);
                vertices.push(position);
            });
        });

        // Triangulate the vertices using earcut
        const flattenedVertices = vertices.flatMap(vertex => [vertex.x, vertex.y, vertex.z]);
        const triangles = earcut(flattenedVertices); // Flatten vertices into a single array

        // Create a polygon mesh using the triangulated indices
        highlightMesh = MeshBuilder.CreatePolygon("highlightFace", { 
            shape: vertices, 
            faceUV: [], // You may need to provide UV coordinates if your mesh has textures
            faceColors: [new Color4(0, 1, 0, 0.5)], // Green color with alpha for transparency
            indices: triangles, // Use the triangulated indices
            sideOrientation: Mesh.DOUBLESIDE 
        }, scene, earcut);

        const material = new StandardMaterial("highlightMaterial", scene);
        material.emissiveColor = new Color3(0, 1, 0); // Green for faces
        material.alpha = 0.5;
        highlightMesh.material = material;
    } else {
        return null;
    }

    if (highlightMesh) {
        highlightMesh.parent = mesh;
    }

    return highlightMesh;
}