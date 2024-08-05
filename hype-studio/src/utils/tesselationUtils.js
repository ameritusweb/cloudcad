import * as BABYLON from '@babylonjs/core';

class PreciseTessellation {
  constructor(mesh, triangleDensityTarget, estimatedTriangles, options = {}) {
    this.mesh = mesh;
    this.triangleDensityTarget = triangleDensityTarget;
    this.estimatedTriangles = estimatedTriangles;
    this.tolerance = options.tolerance || 0.05; // 5% tolerance
    this.maxIterations = options.maxIterations || 10; // Prevent infinite loops
    this.maxEdgeLength = options.maxEdgeLength || 1.0; // Max length of an edge
    this.angleTolerance = options.angleTolerance || Math.PI / 6; // Angle tolerance for curvature
    this.distanceThreshold = options.distanceThreshold || 0.25; // Threshold for acceptable distance change
  }

  tessellate() {
    let currentTriangles = this.mesh.getTotalIndices() / 3;
    let iterations = 0;
    let surfaceArea = this.calculateSurfaceArea();

    while (iterations < this.maxIterations) {
      let currentDensity = currentTriangles / surfaceArea;

      if (Math.abs(currentDensity - this.triangleDensityTarget) / this.triangleDensityTarget <= this.tolerance) {
        // We've reached our target density within tolerance
        break;
      }

      if (currentTriangles >= this.estimatedTriangles) {
        // We've exceeded our estimated triangle count
        break;
      }

      this.adaptiveSubdivide();
      currentTriangles = this.mesh.getTotalIndices() / 3;
      iterations++;
    }

    return this.mesh;
  }

  adaptiveSubdivide() {
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = this.mesh.getIndices();
    const normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    const uvs = this.mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

    const newPositions = [];
    const newIndices = [];
    const newNormals = [];
    const newUVs = [];

    // Step 1: Calculate face points
    const facePoints = this.calculateFacePoints(positions, indices, uvs);

    // Step 2: Calculate edge points
    const edgePoints = this.calculateEdgePoints(positions, indices, facePoints, uvs);

    // Step 3: Update original vertices
    const updatedVertices = this.updateOriginalVertices(positions, indices, facePoints, edgePoints);

    // Step 4: Validate new positions
    this.validateNewPositions(positions, updatedVertices);

    // Step 5: Create new mesh structure
    this.createNewMeshStructure(updatedVertices, facePoints, edgePoints, indices, newPositions, newIndices, newUVs);

    // Step 6: Calculate new normals
    this.calculateNewNormals(newPositions, newIndices, newNormals);

    // Step 7: Calculate distances between old and new triangles
    this.calculateTriangleDistances(indices, positions, newIndices, newPositions);

    // Update the mesh with new data
    this.mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, newPositions);
    this.mesh.setIndices(newIndices);
    this.mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, newNormals);
    this.mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVs);

    // Step 8: Check for orphaned triangles
    this.checkForOrphanedTriangles(newIndices);
  }

  calculateFacePoints(positions, indices, uvs) {
    const facePoints = [];
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new BABYLON.Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new BABYLON.Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new BABYLON.Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
      const facePoint = v1.add(v2).add(v3).scale(1 / 3);

      const uv1 = new BABYLON.Vector2(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
      const uv2 = new BABYLON.Vector2(uvs[indices[i + 1] * 2], uvs[indices[i + 1] * 2 + 1]);
      const uv3 = new BABYLON.Vector2(uvs[indices[i + 2] * 2], uvs[indices[i + 2] * 2 + 1]);
      const faceUV = uv1.add(uv2).add(uv3).scale(1 / 3);

      facePoints.push({ position: facePoint, uv: faceUV });
    }
    console.log("Face Points:", facePoints);
    return facePoints;
  }

  calculateEdgePoints(positions, indices, facePoints, uvs) {
    const edgePoints = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const v1Index = indices[i + j];
        const v2Index = indices[i + (j + 1) % 3];
        const edgeKey = this.getEdgeKey(v1Index, v2Index);

        if (!edgePoints.has(edgeKey)) {
          const v1 = new BABYLON.Vector3(positions[v1Index * 3], positions[v1Index * 3 + 1], positions[v1Index * 3 + 2]);
          const v2 = new BABYLON.Vector3(positions[v2Index * 3], positions[v2Index * 3 + 1], positions[v2Index * 3 + 2]);
          const facePoint = facePoints[Math.floor(i / 3)].position;
          const edgePoint = v1.add(v2).add(facePoint).scale(1 / 3);

          const uv1 = new BABYLON.Vector2(uvs[v1Index * 2], uvs[v1Index * 2 + 1]);
          const uv2 = new BABYLON.Vector2(uvs[v2Index * 2], uvs[v2Index * 2 + 1]);
          const faceUV = facePoints[Math.floor(i / 3)].uv;
          const edgeUV = uv1.add(uv2).add(faceUV).scale(1 / 3);

          edgePoints.set(edgeKey, { position: edgePoint, uv: edgeUV });
        }
      }
    }
    console.log("Edge Points:", edgePoints);
    return edgePoints;
  }

  updateOriginalVertices(positions, indices, facePoints, edgePoints) {
    const updatedVertices = [];
    const vertexFaces = new Map();
    const vertexEdges = new Map();

    // Collect face and edge information for each vertex
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const vIndex = indices[i + j];
        if (!vertexFaces.has(vIndex)) vertexFaces.set(vIndex, []);
        if (!vertexEdges.has(vIndex)) vertexEdges.set(vIndex, []);
        vertexFaces.get(vIndex).push(Math.floor(i / 3));
        vertexEdges.get(vIndex).push(this.getEdgeKey(vIndex, indices[i + (j + 1) % 3]));
        vertexEdges.get(vIndex).push(this.getEdgeKey(vIndex, indices[i + (j + 2) % 3]));
      }
    }

    // Update each vertex
    for (let i = 0; i < positions.length / 3; i++) {
      const v = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const n = vertexFaces.get(i).length;

      let avgVector = new BABYLON.Vector3(0, 0, 0);

      vertexFaces.get(i).forEach(fIndex => {
        avgVector = avgVector.add(BABYLON.Vector3.Normalize(facePoints[fIndex].position.subtract(v)));
      });

      vertexEdges.get(i).forEach(eKey => {
        avgVector = avgVector.add(BABYLON.Vector3.Normalize(edgePoints.get(eKey).position.subtract(v)));
      });

      avgVector = avgVector.scale(1 / (vertexFaces.get(i).length + vertexEdges.get(i).length / 2)).normalize();

      // Scaling factor (adjust as needed)
      const moveDistance = 0.2; 

      const updatedV = v.add(avgVector.scale(moveDistance));
      updatedVertices.push(updatedV);
    }

    console.log("Updated Vertices:", updatedVertices);
    return updatedVertices;
}


  validateNewPositions(oldPositions, newPositions) {
    newPositions.forEach((newPos, index) => {
      const oldVector = new BABYLON.Vector3(oldPositions[index * 3], oldPositions[index * 3 + 1], oldPositions[index * 3 + 2]);
      const newVector = newPos;
      const distance = BABYLON.Vector3.Distance(oldVector, newVector);
      if (distance > this.distanceThreshold) {
        console.warn(`Vertex ${index} moved ${distance} units, which exceeds the threshold.`);
      }
    });
  }

  createNewMeshStructure(updatedVertices, facePoints, edgePoints, indices, newPositions, newIndices, newUVs) {
    const vertexMap = new Map();

    // Add updated original vertices
    updatedVertices.forEach((v, i) => {
      vertexMap.set(i, newPositions.length / 3);
      newPositions.push(v.x, v.y, v.z);
    });

    // Add face points
    facePoints.forEach((f, i) => {
      vertexMap.set(`f${i}`, newPositions.length / 3);
      newPositions.push(f.position.x, f.position.y, f.position.z);
      newUVs.push(f.uv.x, f.uv.y);
    });

    // Add edge points
    edgePoints.forEach((e, key) => {
      vertexMap.set(key, newPositions.length / 3);
      newPositions.push(e.position.x, e.position.y, e.position.z);
      newUVs.push(e.uv.x, e.uv.y);
    });

    // Create new faces
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = indices[i];
      const v2 = indices[i + 1];
      const v3 = indices[i + 2];
      const f = `f${Math.floor(i / 3)}`;

      const e1 = this.getEdgeKey(v1, v2);
      const e2 = this.getEdgeKey(v2, v3);
      const e3 = this.getEdgeKey(v3, v1);

      newIndices.push(
        vertexMap.get(v1), vertexMap.get(e1), vertexMap.get(f),
        vertexMap.get(e1), vertexMap.get(v2), vertexMap.get(f),
        vertexMap.get(v2), vertexMap.get(e2), vertexMap.get(f),
        vertexMap.get(e2), vertexMap.get(v3), vertexMap.get(f),
        vertexMap.get(v3), vertexMap.get(e3), vertexMap.get(f),
        vertexMap.get(e3), vertexMap.get(v1), vertexMap.get(f)
      );
    }
    console.log("New Positions:", newPositions);
    console.log("New Indices:", newIndices);
  }

  calculateNewNormals(newPositions, newIndices, newNormals) {
    // Initialize normals array
    for (let i = 0; i < newPositions.length; i += 3) {
      newNormals.push(0, 0, 0);
    }

    // Calculate flat normals and accumulate
    for (let i = 0; i < newIndices.length; i += 3) {
      const v1Index = newIndices[i];
      const v2Index = newIndices[i + 1];
      const v3Index = newIndices[i + 2];

      const v1 = new BABYLON.Vector3(newPositions[v1Index * 3], newPositions[v1Index * 3 + 1], newPositions[v1Index * 3 + 2]);
      const v2 = new BABYLON.Vector3(newPositions[v2Index * 3], newPositions[v2Index * 3 + 1], newPositions[v2Index * 3 + 2]);
      const v3 = new BABYLON.Vector3(newPositions[v3Index * 3], newPositions[v3Index * 3 + 1], newPositions[v3Index * 3 + 2]);

      const normal = BABYLON.Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).normalize();

      // Accumulate normals for shared vertices
      newNormals[v1Index * 3] += normal.x;
      newNormals[v1Index * 3 + 1] += normal.y;
      newNormals[v1Index * 3 + 2] += normal.z;

      newNormals[v2Index * 3] += normal.x;
      newNormals[v2Index * 3 + 1] += normal.y;
      newNormals[v2Index * 3 + 2] += normal.z;

      newNormals[v3Index * 3] += normal.x;
      newNormals[v3Index * 3 + 1] += normal.y;
      newNormals[v3Index * 3 + 2] += normal.z;
    }

    // Normalize the normals
    for (let i = 0; i < newNormals.length; i += 3) {
      const normal = new BABYLON.Vector3(newNormals[i], newNormals[i + 1], newNormals[i + 2]).normalize();
      newNormals[i] = normal.x;
      newNormals[i + 1] = normal.y;
      newNormals[i + 2] = normal.z;
    }
    console.log("New Normals:", newNormals);
  }

  getEdgeKey(v1, v2) {
    return v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
  }

  calculateSurfaceArea() {
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = this.mesh.getIndices();
    let totalArea = 0;

    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new BABYLON.Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new BABYLON.Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new BABYLON.Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

      const triangleArea = BABYLON.Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).length() / 2;
      totalArea += triangleArea;
    }

    return totalArea;
  }

  checkForOrphanedTriangles(indices) {
    const edgeUsageCount = new Map();

    // Count the usage of each edge
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const v1 = indices[i + j];
        const v2 = indices[i + (j + 1) % 3];
        const edgeKey = this.getEdgeKey(v1, v2);
        edgeUsageCount.set(edgeKey, (edgeUsageCount.get(edgeKey) || 0) + 1);
      }
    }

    // Check for orphaned triangles
    const orphanedTriangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      let orphaned = false;
      for (let j = 0; j < 3; j++) {
        const v1 = indices[i + j];
        const v2 = indices[i + (j + 1) % 3];
        const edgeKey = this.getEdgeKey(v1, v2);
        if (edgeUsageCount.get(edgeKey) === 1) {
          orphaned = true;
          break;
        }
      }
      if (orphaned) {
        orphanedTriangles.push([indices[i], indices[i + 1], indices[i + 2]]);
      }
    }

    if (orphanedTriangles.length > 0) {
      console.error('Orphaned triangles found:', orphanedTriangles);
    } else {
      console.log('No orphaned triangles found.');
    }
  }

  calculateTriangleDistances(oldIndices, oldPositions, newIndices, newPositions) {
    const oldTriangles = this.calculateTriangleCentroids(oldIndices, oldPositions);
    const newTriangles = this.calculateTriangleCentroids(newIndices, newPositions);

    oldTriangles.forEach((oldTriangle, index) => {
      const newTriangle = newTriangles[index];
      const distance = BABYLON.Vector3.Distance(oldTriangle, newTriangle);
      if (distance > this.distanceThreshold) {
        console.warn(`Triangle ${index} moved ${distance} units`);
      }
    });
  }

  calculateTriangleCentroids(indices, positions) {
    const centroids = [];
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new BABYLON.Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new BABYLON.Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new BABYLON.Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
      const centroid = v1.add(v2).add(v3).scale(1 / 3);
      centroids.push(centroid);
    }
    return centroids;
  }
}

export function applyPreciseTessellation(mesh, triangleDensityTarget, estimatedTriangles, options = {}) {
  const tessellation = new PreciseTessellation(mesh, triangleDensityTarget, estimatedTriangles, options);
  return tessellation.tessellate();
}

export function calculateSurfaceArea(tessellatedMesh) {
  return new PreciseTessellation(tessellatedMesh, 0, 0).calculateSurfaceArea();
}