import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Slider } from '@babylonjs/gui';

/**
 * Utility class for bending a long thin mesh (rectangle, cylinder, or any custom shape) into a bent shape like a semicircle or a ring.
 */
class BendUtils {
  /**
   * Creates an instance of BendUtils.
   * @param {BABYLON.Scene} scene - The Babylon.js scene.
   * @param {string} type - The type of mesh ('rectangle', 'cylinder', or custom mesh name).
   * @param {number} length - The length of the mesh.
   * @param {number} width - The width of the mesh.
   * @param {number} segments - The number of segments for bending.
   * @param {number} bendAmount - The amount of bend (0.0 to 1.0, where 1.0 is a full circle).
   */
  constructor(scene, type, length, width, segments, bendAmount) {
    this.scene = scene;
    this.type = type; // 'rectangle', 'cylinder', or custom mesh name
    this.length = length;
    this.width = width;
    this.segments = segments;
    this.bendAmount = bendAmount; // 0.0 to 1.0, where 1.0 represents a full circle
    this.bendAxis = BABYLON.Axis.Z; // Default bending axis: Z

    this.mesh = this.createMesh();
    this.updateMesh();
  }

  /**
   * Creates the initial mesh (rectangle, cylinder, or custom).
   * @returns {BABYLON.Mesh} The created mesh.
   */
  createMesh() {
    if (this.type === 'rectangle') {
      return BABYLON.MeshBuilder.CreatePlane("bendablePlane", {
        width: this.width,
        height: this.length,
        subdivisions: this.segments
      }, this.scene);
    } else if (this.type === 'cylinder') {
      return BABYLON.MeshBuilder.CreateCylinder("bendableCylinder", {
        height: this.length,
        diameter: this.width,
        tessellation: this.segments,
        subdivisions: this.segments
      }, this.scene);
    } else {
      // Assume it's a custom mesh
      return this.scene.getMeshByName(this.type);
    }
  }

  /**
   * Updates the mesh to simulate bending.
   */
  updateMesh() {
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    const radius = (this.length / Math.PI) * this.bendAmount;
    const angleStep = (Math.PI * 2 * this.bendAmount) / this.segments;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      // Determine the axis to bend along
      const bendCoord = this.bendAxis === BABYLON.Axis.X ? x : (this.bendAxis === BABYLON.Axis.Y ? y : z);

      const angle = (bendCoord / this.length) * Math.PI * 2 * this.bendAmount;

      // Calculate new coordinates based on bending axis
      let newX = x, newY = y, newZ = z;
      if (this.bendAxis === BABYLON.Axis.X) {
        newY = radius * Math.sin(angle);
        newZ = radius * (1 - Math.cos(angle));
      } else if (this.bendAxis === BABYLON.Axis.Y) {
        newX = radius * Math.sin(angle);
        newZ = radius * (1 - Math.cos(angle));
      } else { // Z-axis
        newX = radius * Math.sin(angle);
        newY = radius * (1 - Math.cos(angle));
      }

      positions[i] = newX;
      positions[i + 1] = newY;
      positions[i + 2] = newZ;
    }

    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
  }

  /**
   * Sets the bend amount and updates the mesh.
   * @param {number} bendAmount - The new bend amount (0.0 to 1.0).
   */
  setBendAmount(bendAmount) {
    this.bendAmount = bendAmount;
    this.updateMesh();
  }

  /**
   * Sets the bending axis and updates the mesh.
   * @param {BABYLON.Vector3} axis - The axis to bend along.
   */
  setBendAxis(axis) {
    this.bendAxis = axis;
    this.updateMesh();
  }
}