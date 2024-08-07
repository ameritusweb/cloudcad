import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 * Class representing a custom curved plane created from an open wireframe geometry.
 */
export class CurvedPlane {
    /**
     * Create a CurvedPlane.
     * @param {BABYLON.Scene} scene - The Babylon.js scene.
     * @param {BABYLON.Vector3[]} wireframePoints - An array of points defining the wireframe.
     * @param {number} [divisions=10] - Number of divisions for the curve interpolation.
     */
    constructor(scene, wireframePoints, divisions = 10) {
        this.scene = scene;
        this.wireframePoints = wireframePoints;
        this.divisions = divisions;

        this.curvedMesh = this.createCurvedMesh();
    }

    /**
     * Creates the curved mesh by interpolating between the wireframe points.
     * @returns {BABYLON.Mesh} - The created curved mesh.
     */
    createCurvedMesh() {
        const path = BABYLON.Curve3.CreateCatmullRomSpline(this.wireframePoints, this.divisions);
        const pathPoints = path.getPoints();
        const width = 1.0; // Define the width of the curved plane
        const shape = [
            new BABYLON.Vector3(-width / 2, 0, 0),
            new BABYLON.Vector3(width / 2, 0, 0)
        ];

        const extrudePath = pathPoints.map(p => new BABYLON.Vector3(p.x, p.y, p.z));
        const curvedMesh = BABYLON.MeshBuilder.ExtrudeShape("curvedPlane", {
            shape: shape,
            path: extrudePath,
            cap: BABYLON.Mesh.NO_CAP,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);

        return curvedMesh;
    }
}