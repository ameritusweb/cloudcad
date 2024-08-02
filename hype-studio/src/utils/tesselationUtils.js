import * as BABYLON from '@babylonjs/core';

class PreciseTessellation {
  constructor(mesh, triangleDensityTarget, estimatedTriangles) {
    this.mesh = mesh;
    this.triangleDensityTarget = triangleDensityTarget;
    this.estimatedTriangles = estimatedTriangles;
    this.tolerance = 0.05; // 5% tolerance
    this.maxIterations = 10; // Prevent infinite loops
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

      this.subdivide();
      currentTriangles = this.mesh.getTotalIndices() / 3;
      iterations++;
    }

    return this.mesh;
  }

  subdivide() {
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = this.mesh.getIndices();
    const normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

    const newPositions = [];
    const newIndices = [];
    const newNormals = [];

    // Step 1: Calculate face points
    const facePoints = this.calculateFacePoints(positions, indices);

    // Step 2: Calculate edge points
    const edgePoints = this.calculateEdgePoints(positions, indices, facePoints);

    // Step 3: Update original vertices
    const updatedVertices = this.updateOriginalVertices(positions, indices, facePoints, edgePoints);

    // Step 4: Create new mesh structure
    this.createNewMeshStructure(updatedVertices, facePoints, edgePoints, indices, newPositions, newIndices);

    // Step 5: Calculate new normals
    this.calculateNewNormals(newPositions, newIndices, newNormals);

    // Update the mesh with new data
    this.mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, newPositions);
    this.mesh.setIndices(newIndices);
    this.mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, newNormals);
  }

  calculateFacePoints(positions, indices) {
    const facePoints = [];
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new BABYLON.Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new BABYLON.Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new BABYLON.Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
      const facePoint = v1.add(v2).add(v3).scale(1/3);
      facePoints.push(facePoint);
    }
    return facePoints;
  }

  calculateEdgePoints(positions, indices, facePoints) {
    const edgePoints = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const v1Index = indices[i + j];
        const v2Index = indices[i + (j + 1) % 3];
        const edgeKey = this.getEdgeKey(v1Index, v2Index);
        
        if (!edgePoints.has(edgeKey)) {
          const v1 = new BABYLON.Vector3(positions[v1Index * 3], positions[v1Index * 3 + 1], positions[v1Index * 3 + 2]);
          const v2 = new BABYLON.Vector3(positions[v2Index * 3], positions[v2Index * 3 + 1], positions[v2Index * 3 + 2]);
          const facePoint = facePoints[i / 3];
          const edgePoint = v1.add(v2).add(facePoint).scale(1/3);
          edgePoints.set(edgeKey, edgePoint);
        }
      }
    }
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
        vertexFaces.get(vIndex).push(i / 3);
        vertexEdges.get(vIndex).push(this.getEdgeKey(vIndex, indices[i + (j + 1) % 3]));
        vertexEdges.get(vIndex).push(this.getEdgeKey(vIndex, indices[i + (j + 2) % 3]));
      }
    }

    // Update each vertex
    for (let i = 0; i < positions.length / 3; i++) {
      const v = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const n = vertexFaces.get(i).length;
      
      let F = new BABYLON.Vector3(0, 0, 0);
      vertexFaces.get(i).forEach(fIndex => {
        F = F.add(facePoints[fIndex]);
      });
      F = F.scale(1 / n);

      let R = new BABYLON.Vector3(0, 0, 0);
      vertexEdges.get(i).forEach(eKey => {
        R = R.add(edgePoints.get(eKey));
      });
      R = R.scale(1 / n);

      const updatedV = F.scale(1 / n).add(R.scale(2 / n)).add(v.scale((n - 3) / n));
      updatedVertices.push(updatedV);
    }

    return updatedVertices;
  }

  createNewMeshStructure(updatedVertices, facePoints, edgePoints, indices, newPositions, newIndices) {
    const vertexMap = new Map();

    // Add updated original vertices
    updatedVertices.forEach((v, i) => {
      vertexMap.set(i, newPositions.length / 3);
      newPositions.push(v.x, v.y, v.z);
    });

    // Add face points
    facePoints.forEach((f, i) => {
      vertexMap.set(`f${i}`, newPositions.length / 3);
      newPositions.push(f.x, f.y, f.z);
    });

    // Add edge points
    edgePoints.forEach((e, key) => {
      vertexMap.set(key, newPositions.length / 3);
      newPositions.push(e.x, e.y, e.z);
    });

    // Create new faces
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = indices[i];
      const v2 = indices[i + 1];
      const v3 = indices[i + 2];
      const f = `f${i / 3}`;

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
  }

  calculateNewNormals(newPositions, newIndices, newNormals) {
    // Calculate flat normals
    for (let i = 0; i < newIndices.length; i += 3) {
      const v1 = new BABYLON.Vector3(newPositions[newIndices[i] * 3], newPositions[newIndices[i] * 3 + 1], newPositions[newIndices[i] * 3 + 2]);
      const v2 = new BABYLON.Vector3(newPositions[newIndices[i + 1] * 3], newPositions[newIndices[i + 1] * 3 + 1], newPositions[newIndices[i + 1] * 3 + 2]);
      const v3 = new BABYLON.Vector3(newPositions[newIndices[i + 2] * 3], newPositions[newIndices[i + 2] * 3 + 1], newPositions[newIndices[i + 2] * 3 + 2]);

      const normal = BABYLON.Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).normalize();

      newNormals[newIndices[i] * 3] = normal.x;
      newNormals[newIndices[i] * 3 + 1] = normal.y;
      newNormals[newIndices[i] * 3 + 2] = normal.z;

      newNormals[newIndices[i + 1] * 3] = normal.x;
      newNormals[newIndices[i + 1] * 3 + 1] = normal.y;
      newNormals[newIndices[i + 1] * 3 + 2] = normal.z;

      newNormals[newIndices[i + 2] * 3] = normal.x;
      newNormals[newIndices[i + 2] * 3 + 1] = normal.y;
      newNormals[newIndices[i + 2] * 3 + 2] = normal.z;
    }
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
}

export function applyPreciseTessellation(mesh, triangleDensityTarget, estimatedTriangles) {
  const tessellation = new PreciseTessellation(mesh, triangleDensityTarget, estimatedTriangles);
  return tessellation.tessellate();
}

export function calculateSurfaceArea(tessellatedMesh) {
    return new PreciseTessellation(tessellatedMesh, 0, 0).calculateSurfaceArea();
}