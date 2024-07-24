import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class SketchVisualGuides {
  constructor(scene, sketchMesh, faceMesh) {
    this.scene = scene;
    this.sketchMesh = sketchMesh;
    this.faceMesh = faceMesh;
    this.guideLines = [];
    this.dimensionLabels = [];
    this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  }

  update() {
    this.clear();
    this.createCenterLines();
    this.createBoundingBox();
    this.createDimensionLabels();
  }

  clear() {
    this.guideLines.forEach(line => line.dispose());
    this.guideLines = [];
    this.dimensionLabels.forEach(label => label.dispose());
    this.dimensionLabels = [];
  }

  createCenterLines() {
    const sketchBoundingBox = this.sketchMesh.getBoundingInfo().boundingBox;
    const faceBoundingBox = this.faceMesh.getBoundingInfo().boundingBox;

    const centerX = (faceBoundingBox.minimumWorld.x + faceBoundingBox.maximumWorld.x) / 2;
    const centerY = (faceBoundingBox.minimumWorld.y + faceBoundingBox.maximumWorld.y) / 2;
    const centerZ = (faceBoundingBox.minimumWorld.z + faceBoundingBox.maximumWorld.z) / 2;

    const verticalLine = BABYLON.MeshBuilder.CreateLines("verticalLine", {
      points: [
        new BABYLON.Vector3(centerX, faceBoundingBox.minimumWorld.y, centerZ),
        new BABYLON.Vector3(centerX, faceBoundingBox.maximumWorld.y, centerZ)
      ]
    }, this.scene);

    const horizontalLine = BABYLON.MeshBuilder.CreateLines("horizontalLine", {
      points: [
        new BABYLON.Vector3(faceBoundingBox.minimumWorld.x, centerY, centerZ),
        new BABYLON.Vector3(faceBoundingBox.maximumWorld.x, centerY, centerZ)
      ]
    }, this.scene);

    verticalLine.color = horizontalLine.color = new BABYLON.Color3(0, 1, 0);
    this.guideLines.push(verticalLine, horizontalLine);
  }

  createBoundingBox() {
    const boundingBox = this.sketchMesh.getBoundingInfo().boundingBox;
    const corners = [
      boundingBox.minimumWorld,
      new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.minimumWorld.y, boundingBox.maximumWorld.z),
      new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.maximumWorld.y, boundingBox.minimumWorld.z),
      new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.maximumWorld.y, boundingBox.maximumWorld.z),
      new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.minimumWorld.y, boundingBox.minimumWorld.z),
      new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.minimumWorld.y, boundingBox.maximumWorld.z),
      new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.maximumWorld.y, boundingBox.minimumWorld.z),
      boundingBox.maximumWorld
    ];

    const lines = [
      [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7],
      [4, 5], [4, 6], [5, 7], [6, 7]
    ];

    lines.forEach(([start, end]) => {
      const line = BABYLON.MeshBuilder.CreateLines("boundingBoxLine", {
        points: [corners[start], corners[end]]
      }, this.scene);
      line.color = new BABYLON.Color3(1, 0, 0);
      this.guideLines.push(line);
    });
  }

  createDimensionLabels() {
    const boundingBox = this.sketchMesh.getBoundingInfo().boundingBox;
    const width = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
    const height = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;

    const widthLabel = new GUI.TextBlock();
    widthLabel.text = `Width: ${width.toFixed(2)}`;
    widthLabel.color = "white";
    widthLabel.fontSize = 14;
    this.advancedTexture.addControl(widthLabel);
    widthLabel.linkWithMesh(this.sketchMesh);
    widthLabel.linkOffsetY = -50;

    const heightLabel = new GUI.TextBlock();
    heightLabel.text = `Height: ${height.toFixed(2)}`;
    heightLabel.color = "white";
    heightLabel.fontSize = 14;
    this.advancedTexture.addControl(heightLabel);
    heightLabel.linkWithMesh(this.sketchMesh);
    heightLabel.linkOffsetY = 50;

    this.dimensionLabels.push(widthLabel, heightLabel);
  }
}

export default SketchVisualGuides;