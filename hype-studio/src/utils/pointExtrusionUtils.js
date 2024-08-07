import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 * Utility class for extruding a wireframe outline to a single point in 3D space.
 */
export class PointExtrusionUtils {
    /**
     * Creates an instance of PointExtrusionUtils.
     * @param {BABYLON.Scene} scene - The Babylon.js scene.
     * @param {BABYLON.Mesh} baseMesh - The base mesh to extrude from.
     * @param {BABYLON.Vector3} extrusionPoint - The point to which the base mesh will be extruded.
     */
    constructor(scene, baseMesh, extrusionPoint) {
        this.scene = scene;
        this.baseMesh = baseMesh;
        this.extrusionPoint = extrusionPoint;

        this.extrudedMesh = this.createExtrudedMesh();
    }

    /**
     * Creates the extruded mesh by connecting the base mesh to the extrusion point.
     * @returns {BABYLON.Mesh} The created extruded mesh.
     */
    createExtrudedMesh() {
        const positions = this.baseMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = this.baseMesh.getIndices();
        const newPositions = [];
        const newIndices = [];
        const pointIndex = positions.length / 3;

        // Add the extrusion point to new positions
        newPositions.push(this.extrusionPoint.x, this.extrusionPoint.y, this.extrusionPoint.z);

        // Copy the base mesh positions
        for (let i = 0; i < positions.length; i++) {
            newPositions.push(positions[i]);
        }

        // Create faces connecting the base mesh to the extrusion point
        for (let i = 0; i < indices.length - 1; i++) {
            const i0 = indices[i];
            const i1 = indices[i + 1];

            newIndices.push(pointIndex, i0, i1); // Triangle connecting the point to an edge of the base
        }

        // Handle open geometries: connect the last point to the first point if not closed
        if (indices[0] !== indices[indices.length - 1]) {
            newIndices.push(pointIndex, indices[indices.length - 1], indices[0]);
        }

        const extrudedMesh = new BABYLON.Mesh("extrudedMesh", this.scene);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = newPositions;
        vertexData.indices = newIndices;
        vertexData.applyToMesh(extrudedMesh);

        return extrudedMesh;
    }
}