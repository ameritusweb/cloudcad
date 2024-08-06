import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Slider, StackPanel, TextBlock } from '@babylonjs/gui';

/**
 * Utility class for twisting a long thin mesh (rectangle) to simulate twisting effects.
 */
export class TwistUtils {
  /**
   * Creates an instance of TwistUtils.
   * @param {BABYLON.Scene} scene - The Babylon.js scene.
   * @param {number} width - The width of the mesh.
   * @param {number} height - The height of the mesh.
   * @param {number} segments - The number of segments for twisting.
   * @param {number} twistAmount - The initial twist amount (in radians).
   * @param {BABYLON.Vector3} twistAxis - The axis to twist around (default: BABYLON.Axis.Y).
   * @param {number} twistExponent - The exponent to control twist distribution (default: 1).
   */
  constructor(scene, width, height, segments, twistAmount = 0, twistAxis = BABYLON.Axis.Y, twistExponent = 1) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.segments = segments;
    this.twistAmount = twistAmount;
    this.twistAxis = twistAxis;
    this.twistExponent = twistExponent;

    this.mesh = this.createMesh();
    this.applyTwist();
    this.createUIControls();
  }

  /**
   * Creates the initial plane mesh.
   * @returns {BABYLON.Mesh} The created plane mesh.
   */
  createMesh() {
    return BABYLON.MeshBuilder.CreatePlane("twistablePlane", {
      width: this.width,
      height: this.height,
      subdivisions: this.segments
    }, this.scene);
  }

  /**
   * Applies the twist deformation to the mesh.
   */
  applyTwist() {
    const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        const index = (i * (this.segments + 1) + j) * 3;
        const x = positions[index] - halfWidth;
        const y = positions[index + 1] - halfHeight;
        const z = positions[index + 2];

        const normalizedPosition = this.twistAxis === BABYLON.Axis.X ? (x + halfWidth) / this.width
                                   : this.twistAxis === BABYLON.Axis.Z ? (z + halfWidth) / this.width
                                   : (y + halfHeight) / this.height;
        const twistAngle = Math.pow(normalizedPosition, this.twistExponent) * this.twistAmount;
        const cosAngle = Math.cos(twistAngle);
        const sinAngle = Math.sin(twistAngle);

        if (this.twistAxis === BABYLON.Axis.X) {
          // Twist around X-axis
          positions[index + 1] = y * cosAngle - z * sinAngle + halfHeight;
          positions[index + 2] = y * sinAngle + z * cosAngle;
        } else if (this.twistAxis === BABYLON.Axis.Z) {
          // Twist around Z-axis
          positions[index] = x * cosAngle - y * sinAngle + halfWidth;
          positions[index + 1] = x * sinAngle + y * cosAngle;
        } else {
          // Twist around Y-axis (default)
          positions[index] = x * cosAngle - z * sinAngle + halfWidth;
          positions[index + 2] = x * sinAngle + z * cosAngle;
        }
      }
    }

    this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
  }

  /**
   * Creates the UI controls for adjusting the twist amount and axis.
   */
  createUIControls() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const panel = new StackPanel();
    panel.width = "220px";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(panel);

    const twistSlider = new Slider();
    twistSlider.minimum = 0;
    twistSlider.maximum = Math.PI * 4; // Maximum twist angle (4 full rotations)
    twistSlider.value = this.twistAmount;
    twistSlider.height = "20px";
    twistSlider.width = "200px";
    twistSlider.onValueChangedObservable.add(value => {
      this.twistAmount = value;
      this.applyTwist();
    });
    panel.addControl(twistSlider);

    const twistText = new TextBlock();
    twistText.text = "Twist Amount";
    twistText.height = "30px";
    twistText.color = "white";
    panel.addControl(twistText);

    // Twist Axis Buttons
    const createButton = (text, axis) => {
      const button = new BABYLON.GUI.Button.CreateSimpleButton(text, text);
      button.width = "100px";
      button.height = "50px";
      button.color = "white";
      button.background = "gray";
      button.onPointerUpObservable.add(() => {
        this.twistAxis = axis;
        this.applyTwist();
      });
      return button;
    };

    const buttonPanel = new StackPanel();
    buttonPanel.width = "200px";
    buttonPanel.isVertical = true;
    buttonPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    buttonPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    const xButton = createButton("Twist X", BABYLON.Axis.X);
    const yButton = createButton("Twist Y", BABYLON.Axis.Y);
    const zButton = createButton("Twist Z", BABYLON.Axis.Z);

    buttonPanel.addControl(xButton);
    buttonPanel.addControl(yButton);
    buttonPanel.addControl(zButton);

    advancedTexture.addControl(buttonPanel);

    // Twist Exponent Slider
    const exponentSlider = new Slider();
    exponentSlider.minimum = 0.1;
    exponentSlider.maximum = 5;
    exponentSlider.value = this.twistExponent;
    exponentSlider.height = "20px";
    exponentSlider.width = "200px";
    exponentSlider.onValueChangedObservable.add(value => {
      this.twistExponent = value;
      this.applyTwist();
    });
    panel.addControl(exponentSlider);

    const exponentText = new TextBlock();
    exponentText.text = "Twist Exponent";
    exponentText.height = "30px";
    exponentText.color = "white";
    panel.addControl(exponentText);
  }
}