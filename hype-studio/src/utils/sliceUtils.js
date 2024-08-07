import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class SliceUtils {
        constructor(scene, mesh, curvedPlane) {
            this.scene = scene;
            this.mesh = mesh;
            this.curvedPlane = curvedPlane;
        }
    
        sliceMesh(keepSideA = true) {
            const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = this.mesh.getIndices();
            const normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            const uvs = this.mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            const newPositions = [];
            const newIndices = [];
            const newNormals = [];
            const newUVs = [];
            const vertexMap = new Map();
    
            // Filter vertices and handle edge intersections
            for (let i = 0; i < indices.length; i += 3) {
                const i0 = indices[i] * 3;
                const i1 = indices[i + 1] * 3;
                const i2 = indices[i + 2] * 3;
    
                const v0 = new BABYLON.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2]);
                const v1 = new BABYLON.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
                const v2 = new BABYLON.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    
                const d0 = this.curvedPlane.signedDistanceTo(v0);
                const d1 = this.curvedPlane.signedDistanceTo(v1);
                const d2 = this.curvedPlane.signedDistanceTo(v2);
    
                if ((d0 >= 0 && d1 < 0) || (d0 < 0 && d1 >= 0)) {
                    const intersection = this.intersectEdge(v0, v1, d0, d1);
                    const n0 = new BABYLON.Vector3(normals[i0], normals[i0 + 1], normals[i0 + 2]);
                    const n1 = new BABYLON.Vector3(normals[i1], normals[i1 + 1], normals[i1 + 2]);
                    const uv0 = new BABYLON.Vector2(uvs[i0 / 3 * 2], uvs[i0 / 3 * 2 + 1]);
                    const uv1 = new BABYLON.Vector2(uvs[i1 / 3 * 2], uvs[i1 / 3 * 2 + 1]);
                    const intersectionNormal = this.interpolateVector3(n0, n1, d0, d1);
                    const intersectionUV = this.interpolateVector2(uv0, uv1, d0, d1);
                    this.addVertex(intersection, intersectionNormal, intersectionUV, vertexMap, newPositions, newNormals, newUVs);
                }
                if ((d1 >= 0 && d2 < 0) || (d1 < 0 && d2 >= 0)) {
                    const intersection = this.intersectEdge(v1, v2, d1, d2);
                    const n1 = new BABYLON.Vector3(normals[i1], normals[i1 + 1], normals[i1 + 2]);
                    const n2 = new BABYLON.Vector3(normals[i2], normals[i2 + 1], normals[i2 + 2]);
                    const uv1 = new BABYLON.Vector2(uvs[i1 / 3 * 2], uvs[i1 / 3 * 2 + 1]);
                    const uv2 = new BABYLON.Vector2(uvs[i2 / 3 * 2], uvs[i2 / 3 * 2 + 1]);
                    const intersectionNormal = this.interpolateVector3(n1, n2, d1, d2);
                    const intersectionUV = this.interpolateVector2(uv1, uv2, d1, d2);
                    this.addVertex(intersection, intersectionNormal, intersectionUV, vertexMap, newPositions, newNormals, newUVs);
                }
                if ((d2 >= 0 && d0 < 0) || (d2 < 0 && d0 >= 0)) {
                    const intersection = this.intersectEdge(v2, v0, d2, d0);
                    const n2 = new BABYLON.Vector3(normals[i2], normals[i2 + 1], normals[i2 + 2]);
                    const n0 = new BABYLON.Vector3(normals[i0], normals[i0 + 1], normals[i0 + 2]);
                    const uv2 = new BABYLON.Vector2(uvs[i2 / 3 * 2], uvs[i2 / 3 * 2 + 1]);
                    const uv0 = new BABYLON.Vector2(uvs[i0 / 3 * 2], uvs[i0 / 3 * 2 + 1]);
                    const intersectionNormal = this.interpolateVector3(n2, n0, d2, d0);
                    const intersectionUV = this.interpolateVector2(uv2, uv0, d2, d0);
                    this.addVertex(intersection, intersectionNormal, intersectionUV, vertexMap, newPositions, newNormals, newUVs);
                }
    
                // Add original vertices if they are on the correct side
                if ((keepSideA && d0 >= 0) || (!keepSideA && d0 < 0)) {
                    const n0 = new BABYLON.Vector3(normals[i0], normals[i0 + 1], normals[i0 + 2]);
                    const uv0 = new BABYLON.Vector2(uvs[i0 / 3 * 2], uvs[i0 / 3 * 2 + 1]);
                    this.addVertex(v0, n0, uv0, vertexMap, newPositions, newNormals, newUVs);
                }
                if ((keepSideA && d1 >= 0) || (!keepSideA && d1 < 0)) {
                    const n1 = new BABYLON.Vector3(normals[i1], normals[i1 + 1], normals[i1 + 2]);
                    const uv1 = new BABYLON.Vector2(uvs[i1 / 3 * 2], uvs[i1 / 3 * 2 + 1]);
                    this.addVertex(v1, n1, uv1, vertexMap, newPositions, newNormals, newUVs);
                }
                if ((keepSideA && d2 >= 0) || (!keepSideA && d2 < 0)) {
                    const n2 = new BABYLON.Vector3(normals[i2], normals[i2 + 1], normals[i2 + 2]);
                    const uv2 = new BABYLON.Vector2(uvs[i2 / 3 * 2], uvs[i2 / 3 * 2 + 1]);
                    this.addVertex(v2, n2, uv2, vertexMap, newPositions, newNormals, newUVs);
                }
            }
    
            // Create new indices based on the updated vertex map
            for (let i = 0; i < indices.length; i += 3) {
                const i0 = indices[i];
                const i1 = indices[i + 1];
                const i2 = indices[i + 2];
    
                if (vertexMap.has(i0) && vertexMap.has(i1) && vertexMap.has(i2)) {
                    newIndices.push(
                        vertexMap.get(i0),
                        vertexMap.get(i1),
                        vertexMap.get(i2)
                    );
                }
            }
    
            const slicedMesh = new BABYLON.Mesh("slicedMesh", this.scene);
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = newPositions;
            vertexData.indices = newIndices;
            vertexData.normals = newNormals;
            vertexData.uvs = newUVs;
            vertexData.applyToMesh(slicedMesh);
    
            return slicedMesh;
        }
    
        // Helper function to calculate edge-plane intersection
        intersectEdge(v1, v2, d1, d2) {
            const t = d1 / (d1 - d2);
            return v1.scale(1 - t).add(v2.scale(t));
        }
    
        // Helper function to interpolate between two BABYLON.Vector3 values
        interpolateVector3(v1, v2, d1, d2) {
            const t = d1 / (d1 - d2);
            return v1.scale(1 - t).add(v2.scale(t));
        }
    
        // Helper function to interpolate between two BABYLON.Vector2 values
        interpolateVector2(v1, v2, d1, d2) {
            const t = d1 / (d1 - d2);
            return new BABYLON.Vector2(
                v1.x * (1 - t) + v2.x * t,
                v1.y * (1 - t) + v2.y * t
            );
        }
    
        // Helper function to add a vertex to the map and positions array
        addVertex(vertex, normal, uv, vertexMap, positions, normals, uvs) {
            const key = vertex.x + "," + vertex.y + "," + vertex.z; // Create a unique key for the vertex
            if (!vertexMap.has(key)) {
                const index = positions.length / 3;
                vertexMap.set(key, index);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(uv.x, uv.y);
            }
        }
    }