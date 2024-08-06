import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

/**
 * Utility class for projecting a wireframe sketch onto a custom curved mesh.
 */
export class ProjectionUtils {
  /**
   * Creates an instance of ProjectionUtils.
   * @param {BABYLON.Scene} scene - The Babylon.js scene.
   * @param {BABYLON.Mesh} sketch - The sketch mesh to project.
   * @param {BABYLON.Mesh} customMesh - The custom curved mesh.
   * @param {BABYLON.Vector3} rayDirection - The direction of the ray tracing.
   */
  constructor(scene, sketch, customMesh, rayDirection) {
    this.scene = scene;
    this.sketch = sketch;
    this.customMesh = customMesh;
    this.rayDirection = rayDirection;
    this.isDragging = false;
    this.lastPointerPosition = null;
    this.rotationSpeed = 0.001; // Smaller value for more granular control

    // Important points on the custom mesh
    this.importantPoints = [
      new BABYLON.Vector3(0, 0, 0), // Add more points as needed
    ];

    // GUI for displaying dimensions
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.dimensionTexts = [];

    this.initPointerEvents();
  }

  /**
   * Initializes pointer event listeners.
   */
  initPointerEvents() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          this.onPointerDown(pointerInfo);
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          this.onPointerUp(pointerInfo);
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          this.onPointerMove(pointerInfo);
          break;
      }
    });
  }

  /**
   * Handles the pointer down event.
   * @param {BABYLON.PointerInfo} pointerInfo - The pointer info.
   */
  onPointerDown(pointerInfo) {
    if (pointerInfo.event.button === 0) { // Left mouse button
      this.isDragging = true;
      this.lastPointerPosition = new BABYLON.Vector2(pointerInfo.event.clientX, pointerInfo.event.clientY);
      this.scene.activeCamera.detachControl(this.scene.getEngine().getRenderingCanvas()); // Detach camera control
    }
  }

  /**
   * Handles the pointer up event.
   * @param {BABYLON.PointerInfo} pointerInfo - The pointer info.
   */
  onPointerUp(pointerInfo) {
    if (pointerInfo.event.button === 0) { // Left mouse button
      this.isDragging = false;
      this.lastPointerPosition = null;
      this.scene.activeCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true); // Reattach camera control
    }
  }

  /**
   * Handles the pointer move event.
   * @param {BABYLON.PointerInfo} pointerInfo - The pointer info.
   */
  onPointerMove(pointerInfo) {
    if (!this.isDragging) return;

    const currentPointerPosition = new BABYLON.Vector2(pointerInfo.event.clientX, pointerInfo.event.clientY);
    const delta = currentPointerPosition.subtract(this.lastPointerPosition);

    // Apply rotation to the sketch based on pointer movement
    this.sketch.rotation.y += delta.x * this.rotationSpeed;
    this.sketch.rotation.x += delta.y * this.rotationSpeed;

    this.lastPointerPosition = currentPointerPosition;

    // Update the wireframe projection
    this.projectWireframe();
  }

  /**
   * Projects the wireframe onto the custom mesh using ray tracing.
   */
  projectWireframe() {
    const newVertices = [];

    // Perform ray tracing for each vertex of the sketch
    const positions = this.sketch.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = BABYLON.Vector3.TransformCoordinates(
        new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]),
        this.sketch.getWorldMatrix()
      );
      const ray = new BABYLON.Ray(vertex, this.rayDirection, 1000);

      const pickInfo = this.customMesh.intersects(ray);
      if (pickInfo.hit) {
        newVertices.push(pickInfo.pickedPoint);
      }
    }

    // Remove the old wireframe
    if (this.wireframe) {
      this.wireframe.dispose();
    }

    // Create new wireframe from the new vertices
    this.createWireframe(newVertices);

    // Update distance display
    this.updateDistanceDisplay(newVertices);
  }

  /**
   * Creates a wireframe from the projected vertices.
   * @param {BABYLON.Vector3[]} vertices - The projected vertices.
   */
  createWireframe(vertices) {
    const lines = [];
    for (let i = 0; i < vertices.length; i++) {
      lines.push([vertices[i], vertices[(i + 1) % vertices.length]]);
    }

    this.wireframe = BABYLON.MeshBuilder.CreateLineSystem("wireframe", { lines }, this.scene);
    this.wireframe.color = new BABYLON.Color3(1, 0, 0); // Set the wireframe color to red
  }

  /**
   * Updates the distance display between projected vertices and important points.
   * @param {BABYLON.Vector3[]} vertices - The projected vertices.
   */
  updateDistanceDisplay(vertices) {
    // Clear previous dimension texts
    this.dimensionTexts.forEach(text => text.dispose());
    this.dimensionTexts = [];

    // Calculate and display distances
    vertices.forEach((vertex, index) => {
      this.importantPoints.forEach((point, pointIndex) => {
        const distance = BABYLON.Vector3.Distance(vertex, point).toFixed(2);
        const text = new TextBlock();
        text.text = `Distance to Point ${pointIndex + 1}: ${distance}`;
        text.color = "white";
        text.fontSize = 14;
        text.top = 50 + index * 20;
        text.left = 10;
        this.gui.addControl(text);
        this.dimensionTexts.push(text);
      });
    });
  }
}