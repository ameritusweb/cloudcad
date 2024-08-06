import KDTree from 'kd-tree-javascript';

// [REF_001] GridUtils class
export class GridUtils {
  constructor(scene, mesh, granularityX = 10, granularityY = 10) {
    this.scene = scene;
    this.mesh = mesh;
    this.granularityX = granularityX;
    this.granularityY = granularityY;
    this.gridPoints = [];
    this.tangentLines = [];
    this.normalLines = [];
    this.wireframe = null;
    this.selectedPoint = null;
    this.originPoint = Vector3.Zero(); // Default origin
    
    this.kdTree = this.buildKDTree();
    this.generateGrid();
    this.createWireframe();
  }

    // [REF_002] Build KD-tree
    buildKDTree() {
        const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
        const vertices = [];

        for (let i = 0; i < positions.length; i += 3) {
        vertices.push({
            x: positions[i],
            y: positions[i + 1],
            z: positions[i + 2],
            index: i / 3
        });
        }

        const distance = (a, b) => Math.sqrt(
        Math.pow(a.x - b.x, 2) + 
        Math.pow(a.y - b.y, 2) + 
        Math.pow(a.z - b.z, 2)
        );

        return new KDTree(vertices, distance, ['x', 'y', 'z']);
    }

    // [REF_003] Generate grid
    generateGrid() {
        this.clearPreviousGrid();
        const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
        const indices = this.mesh.getIndices();
        const normals = this.mesh.getVerticesData(VertexBuffer.NormalKind);

        const totalDistanceX = this.calculateSurfaceDistance(positions, indices, 0);
        const totalDistanceY = this.calculateSurfaceDistance(positions, indices, 1);

        for (let i = 0; i <= this.granularityX; i++) {
        for (let j = 0; j <= this.granularityY; j++) {
            const u = i / this.granularityX;
            const v = j / this.granularityY;
            const point = this.getPointOnMesh(u * totalDistanceX, v * totalDistanceY);
            if (point) {
            const normal = this.interpolateNormal(point, positions, indices, normals);
            const tangent = this.calculateTangent(point, normal);
            this.createGridPoint(point, tangent, normal);
            }
        }
        }
    }

     // [REF_004] Get point on mesh using KD-tree
    getPointOnMesh(targetDistanceX, targetDistanceY) {
        const queryPoint = { x: targetDistanceX, y: targetDistanceY, z: 0 };
        const nearest = this.kdTree.nearest(queryPoint, 1)[0];
        return new Vector3(nearest[0].x, nearest[0].y, nearest[0].z);
    }

    // [REF_005] Perform local subdivision
    performLocalSubdivision(gridPointIndex) {
        if (gridPointIndex < 0 || gridPointIndex >= this.gridPoints.length) {
        console.error("Invalid grid point index");
        return;
        }
    
        const subdivisionPoint = this.gridPoints[gridPointIndex].position;
        const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
        const indices = this.mesh.getIndices();
        const normals = this.mesh.getVerticesData(VertexBuffer.NormalKind);
    
        // Find the triangle containing the subdivision point using KD-tree
        const nearestVertex = this.kdTree.nearest(subdivisionPoint, 1)[0];
        const nearestVertexIndex = nearestVertex[0].index;
    
        let targetTriangle = -1;
        for (let i = 0; i < indices.length; i += 3) {
        if (indices[i] === nearestVertexIndex || indices[i + 1] === nearestVertexIndex || indices[i + 2] === nearestVertexIndex) {
            const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
            const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
            const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
    
            if (this.isPointInTriangle(subdivisionPoint, v1, v2, v3)) {
            targetTriangle = i;
            break;
            }
        }
        }
    
        if (targetTriangle === -1) {
        console.error("Subdivision point is not within any triangle");
        return;
        }
    
        // [REF_005.1] Perform the subdivision
        const newVertexIndex = positions.length / 3;
        positions.push(subdivisionPoint.x, subdivisionPoint.y, subdivisionPoint.z);
    
        // [REF_005.2] Calculate the normal for the new vertex
        const n1 = new Vector3(normals[indices[targetTriangle] * 3], normals[indices[targetTriangle] * 3 + 1], normals[indices[targetTriangle] * 3 + 2]);
        const n2 = new Vector3(normals[indices[targetTriangle + 1] * 3], normals[indices[targetTriangle + 1] * 3 + 1], normals[indices[targetTriangle + 1] * 3 + 2]);
        const n3 = new Vector3(normals[indices[targetTriangle + 2] * 3], normals[indices[targetTriangle + 2] * 3 + 1], normals[indices[targetTriangle + 2] * 3 + 2]);
        const newNormal = n1.add(n2).add(n3).normalize();
        normals.push(newNormal.x, newNormal.y, newNormal.z);
    
        // [REF_005.3] Create three new triangles
        const newTriangles = [
        indices[targetTriangle], indices[targetTriangle + 1], newVertexIndex,
        indices[targetTriangle + 1], indices[targetTriangle + 2], newVertexIndex,
        indices[targetTriangle + 2], indices[targetTriangle], newVertexIndex
        ];
    
        // [REF_005.4] Replace the old triangle with the three new ones
        indices.splice(targetTriangle, 3, ...newTriangles);
    
        // [REF_005.5] Update the mesh with new data
        this.mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
        this.mesh.updateVerticesData(VertexBuffer.NormalKind, normals);
        this.mesh.setIndices(indices);
    
        // [REF_005.6] Update the KD-tree
        this.kdTree = this.buildKDTree();
    
        // [REF_005.7] Regenerate the grid and wireframe
        this.generateGrid();
        this.createWireframe();
    }

    // [REF_006] Get closest grid point using KD-tree
    getClosestGridPoint(position) {
        const nearest = this.kdTree.nearest({ x: position.x, y: position.y, z: position.z }, 1)[0];
        return {
        index: nearest[0].index,
        position: new Vector3(nearest[0].x, nearest[0].y, nearest[0].z)
        };
    }

    // [REF_007] createGridPoint method
  createGridPoint(position, tangent, normal) {
    const point = MeshBuilder.CreateSphere(`gridPoint`, { diameter: 0.05 }, this.scene);
    point.position = position;
    point.material = new StandardMaterial(`gridPointMat`, this.scene);
    point.material.diffuseColor = new Color3(1, 0, 0);

    this.gridPoints.push(point);

    // Create tangent and normal lines
    this.createVectorLine(position, tangent, Color3.Blue());
    this.createVectorLine(position, normal, Color3.Green());

    // Add hover effect
    point.actionManager = new BABYLON.ActionManager(this.scene);
    point.actionManager.registerAction(
      new BABYLON.InterpolateValueAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        point.material,
        'diffuseColor',
        new Color3(0, 1, 0),
        150
      )
    );
    point.actionManager.registerAction(
      new BABYLON.InterpolateValueAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        point.material,
        'diffuseColor',
        new Color3(1, 0, 0),
        150
      )
    );
  }

  // [REF_008] Create wireframe
  createWireframe() {
    if (this.wireframe) {
      this.wireframe.dispose();
    }
    this.wireframe = MeshBuilder.CreateLines("wireframe", {
      points: this.mesh.getVerticesData(VertexBuffer.PositionKind),
      indices: this.mesh.getIndices()
    }, this.scene);
    this.wireframe.color = new Color3(0.5, 0.5, 0.5);
  }

  // [REF_009] Set grid granularity
  setGranularity(x, y) {
    this.granularityX = x;
    this.granularityY = y;
    this.generateGrid();
    this.createWireframe();
  }

  // [REF_010] Clear previous grid
  clearPreviousGrid() {
    this.gridPoints.forEach(point => point.dispose());
    this.tangentLines.forEach(line => line.dispose());
    this.normalLines.forEach(line => line.dispose());
    this.gridPoints = [];
    this.tangentLines = [];
    this.normalLines = [];
  }

  // [REF_011] Set origin point
  setOriginPoint(point) {
    this.originPoint = point;
    this.generateGrid();
  }

  // [REF_012] Calculate surface distance
  calculateSurfaceDistance(positions, indices, direction) {
    let totalDistance = 0;
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

      totalDistance += Math.max(
        Math.abs(v2[direction] - v1[direction]),
        Math.abs(v3[direction] - v1[direction]),
        Math.abs(v3[direction] - v2[direction])
      );
    }
    return totalDistance;
  }
  
  // [REF_013] interpolateNormal method
  interpolateNormal(point, positions, indices, normals) {
    // Find the triangle containing the point and interpolate the normal
    // This is a simplified version and may need to be improved for accuracy
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);

      if (this.isPointInTriangle(point, v1, v2, v3)) {
        const n1 = new Vector3(normals[indices[i] * 3], normals[indices[i] * 3 + 1], normals[indices[i] * 3 + 2]);
        const n2 = new Vector3(normals[indices[i + 1] * 3], normals[indices[i + 1] * 3 + 1], normals[indices[i + 1] * 3 + 2]);
        const n3 = new Vector3(normals[indices[i + 2] * 3], normals[indices[i + 2] * 3 + 1], normals[indices[i + 2] * 3 + 2]);

        // Barycentric coordinates for interpolation
        const [u, v, w] = this.calculateBarycentricCoordinates(point, v1, v2, v3);
        return n1.scale(u).add(n2.scale(v)).add(n3.scale(w)).normalize();
      }
    }
    return Vector3.Up(); // Default if not found
  }

   // [REF_014] calculateTangent method
   calculateTangent(point, normal) {
    // This is a simplified tangent calculation
    const upVector = Vector3.Up();
    let tangent = Vector3.Cross(normal, upVector);
    if (tangent.lengthSquared() < 0.001) {
      tangent = Vector3.Cross(normal, Vector3.Forward());
    }
    return tangent.normalize();
  }

  // [REF_015] isPointInTriangle method
  isPointInTriangle(p, a, b, c) {
    const [u, v, w] = this.calculateBarycentricCoordinates(p, a, b, c);
    return u >= 0 && v >= 0 && w >= 0 && Math.abs(u + v + w - 1.0) < 0.00001;
  }

  // [REF_016] calculateBarycentricCoordinates method
  calculateBarycentricCoordinates(p, a, b, c) {
    const v0 = b.subtract(a);
    const v1 = c.subtract(a);
    const v2 = p.subtract(a);
    const d00 = Vector3.Dot(v0, v0);
    const d01 = Vector3.Dot(v0, v1);
    const d11 = Vector3.Dot(v1, v1);
    const d20 = Vector3.Dot(v2, v0);
    const d21 = Vector3.Dot(v2, v1);
    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1.0 - v - w;
    return [u, v, w];
  }

  // [REF_017] createVectorLine method
  createVectorLine(start, direction, color) {
    const end = start.add(direction.scale(0.1));
    const line = MeshBuilder.CreateLines(`vectorLine`, { points: [start, end] }, this.scene);
    line.color = color;
    this.tangentLines.push(line);
  }

  // [REF_018] toggleGridVisibility method
  toggleGridVisibility(visible) {
    this.gridPoints.forEach(point => point.setEnabled(visible));
    this.tangentLines.forEach(line => line.setEnabled(visible));
    this.normalLines.forEach(line => line.setEnabled(visible));
  }

  // [REF_019] selectGridPoint method
  selectGridPoint(index) {
    if (index >= 0 && index < this.gridPoints.length) {
      this.gridPoints.forEach(point => point.material.emissiveColor = Color3.Black());
      this.gridPoints[index].material.emissiveColor = Color3.Yellow();
      return this.gridPoints[index].position;
    }
    return null;
  }

  // [REF_020] getClosestGridPoint method
  getClosestGridPoint(position) {
    let closestPoint = null;
    let minDistance = Infinity;
    this.gridPoints.forEach((point, index) => {
      const distance = Vector3.Distance(position, point.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = { index, position: point.position };
      }
    });
    return closestPoint;
  }

  // [REF_021] exportGridData method
  exportGridData() {
    return this.gridPoints.map(point => ({
      position: point.position,
      normal: this.normalLines.find(line => line.position.equals(point.position)).getDirection(),
      tangent: this.tangentLines.find(line => line.position.equals(point.position)).getDirection()
    }));
  }

  // [REF_022] setVectorLineLength method
  setVectorLineLength(length) {
    this.vectorLineLength = length;
    this.updateVectorLines();
  }
  
  // [REF_023] updateVectorLines method
  updateVectorLines() {
    this.tangentLines.forEach((line, index) => {
      const start = this.gridPoints[index].position;
      const direction = line.getDirection().normalize();
      const end = start.add(direction.scale(this.vectorLineLength));
      line.dispose();
      this.tangentLines[index] = MeshBuilder.CreateLines(`tangentLine`, { points: [start, end] }, this.scene);
      this.tangentLines[index].color = Color3.Blue();
    });
  
    this.normalLines.forEach((line, index) => {
      const start = this.gridPoints[index].position;
      const direction = line.getDirection().normalize();
      const end = start.add(direction.scale(this.vectorLineLength));
      line.dispose();
      this.normalLines[index] = MeshBuilder.CreateLines(`normalLine`, { points: [start, end] }, this.scene);
      this.normalLines[index].color = Color3.Green();
    });
  }

  // [REF_024] calculateSurfaceArea method
  calculateSurfaceArea() {
    const positions = this.mesh.getVerticesData(VertexData.PositionKind);
    const indices = this.mesh.getIndices();
    let totalArea = 0;
  
    for (let i = 0; i < indices.length; i += 3) {
      const v1 = new Vector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
      const v2 = new Vector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
      const v3 = new Vector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
  
      const triangleArea = Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).length() / 2;
      totalArea += triangleArea;
    }
  
    return totalArea;
  }

  // [REF_025] generateUVCoordinates method
  generateUVCoordinates() {
    const uvs = this.gridPoints.map(point => {
      const u = point.position.x / this.calculateSurfaceDistance(this.mesh.getVerticesData(VertexData.PositionKind), this.mesh.getIndices(), 0);
      const v = point.position.y / this.calculateSurfaceDistance(this.mesh.getVerticesData(VertexData.PositionKind), this.mesh.getIndices(), 1);
      return new Vector2(u, v);
    });
    return uvs;
  }
}