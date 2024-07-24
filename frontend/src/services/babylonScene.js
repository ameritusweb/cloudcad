import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class BabylonSceneService {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = this.createCamera();
    this.light = this.createLight();
    this.meshes = [];
    this.failureArrows = [];
    this.tooltips = [];

    // Run the render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle browser resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  createCamera() {
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), this.scene);
    camera.attachControl(this.canvas, true);
    return camera;
  }

  createLight() {
    return new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this.scene);
  }

  updateScene(modelData, analysisResults, failurePoints) {
    this.clearScene();
    this.renderModel(modelData);
    if (analysisResults && failurePoints) {
      this.visualizeAnalysisResults(analysisResults, failurePoints);
    }
  }

  clearScene() {
    this.meshes.forEach(mesh => mesh.dispose());
    this.meshes = [];
    this.failureArrows.forEach(arrow => arrow.dispose());
    this.failureArrows = [];
    this.tooltips.forEach(tooltip => tooltip.dispose());
    this.tooltips = [];
  }

  renderModel(modelData) {
    modelData.objects.forEach(obj => {
      let mesh;
      switch (obj.type) {
        case 'Box':
          mesh = BABYLON.MeshBuilder.CreateBox(obj.id, obj.parameters, this.scene);
          break;
        case 'Cylinder':
          mesh = BABYLON.MeshBuilder.CreateCylinder(obj.id, obj.parameters, this.scene);
          break;
        case 'Sphere':
          mesh = BABYLON.MeshBuilder.CreateSphere(obj.id, obj.parameters, this.scene);
          break;
        case 'custom':
          const vertexData = new BABYLON.VertexData();
          vertexData.positions = obj.geometry.vertices.flat();
          vertexData.indices = obj.geometry.indices.flat();
          mesh = new BABYLON.Mesh(obj.id, this.scene);
          vertexData.applyToMesh(mesh);
          break;
      }

      if (mesh) {
        mesh.position = new BABYLON.Vector3(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation = new BABYLON.Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        mesh.scaling = new BABYLON.Vector3(obj.scaling.x, obj.scaling.y, obj.scaling.z);

        const material = new BABYLON.StandardMaterial(obj.id + "_material", this.scene);
        material.diffuseColor = new BABYLON.Color3(obj.color.r, obj.color.g, obj.color.b);
        mesh.material = material;

        this.meshes.push(mesh);
      }
    });
  }

  visualizeAnalysisResults(analysisResults, failurePoints) {
    failurePoints.forEach((point, index) => {
      const start = new BABYLON.Vector3(point.position.x, point.position.y, point.position.z);
      const direction = new BABYLON.Vector3(0, 1, 0);  // Point upwards
      const length = 0.5;  // Length of the arrow

      const color = new BABYLON.Color3(point.severity, 1 - point.severity, 0);  // Red to Green based on severity
      
      const arrow = BABYLON.MeshBuilder.CreateArrow(`failureArrow_${index}`, {
        width: 0.1,
        height: 0.4,
        depth: 0.1,
        direction: direction,
      }, this.scene);

      arrow.position = start;
      arrow.scaling = new BABYLON.Vector3(length, length, length);

      const material = new BABYLON.StandardMaterial(`arrowMaterial_${index}`, this.scene);
      material.diffuseColor = color;
      material.emissiveColor = color;
      arrow.material = material;

      this.failureArrows.push(arrow);

      // Add tooltip
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
      const tooltip = new GUI.Rectangle("tooltip");
      tooltip.width = "300px";
      tooltip.height = "auto";
      tooltip.cornerRadius = 20;
      tooltip.color = "White";
      tooltip.thickness = 2;
      tooltip.background = "Black";
      advancedTexture.addControl(tooltip);
      tooltip.linkWithMesh(arrow);
      tooltip.isVisible = false;

      const tooltipText = new GUI.TextBlock();
      tooltipText.text = `Stress: ${point.stress.toFixed(2)} MPa\nSafety Factor: ${point.safety_factor.toFixed(2)}\n\nRecommendation:\n${point.recommendations[0]}`;  // Show the first recommendation
      tooltipText.color = "white";
      tooltipText.fontSize = 14;
      tooltipText.textWrapping = true;
      tooltip.addControl(tooltipText);

      this.tooltips.push(tooltip);

      arrow.actionManager = new BABYLON.ActionManager(this.scene);
      arrow.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
        tooltip.isVisible = true;
      }));
      arrow.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
        tooltip.isVisible = false;
      }));
    });
  }

  setFailureArrowsVisibility(visible) {
    this.failureArrows.forEach(arrow => arrow.setEnabled(visible));
    this.tooltips.forEach(tooltip => tooltip.isVisible = visible);
  }

  dispose() {
    this.engine.dispose();
  }
}

export default BabylonSceneService;