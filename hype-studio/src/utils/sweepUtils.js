import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Slider, StackPanel, TextBlock } from '@babylonjs/gui';

/**
 * Utility class for sweeping a base mesh around a specified axis to create a new mesh.
 */
export class SweepUtils {
    /**
     * Creates an instance of SweepUtils.
     * @param {BABYLON.Scene} scene - The Babylon.js scene.
     * @param {BABYLON.Mesh} baseMesh - The base mesh to sweep.
     * @param {BABYLON.Vector3} rotationAxis - The axis to rotate around (default: BABYLON.Axis.Y).
     * @param {number} rotationAngle - The total rotation angle in radians (default: 2 * Math.PI).
     * @param {number} steps - The number of rotation steps (default: 36).
     * @param {BABYLON.Vector3} center - The center of rotation (default: BABYLON.Vector3.Zero()).
     */
    constructor(scene, baseMesh, rotationAxis = BABYLON.Axis.Y, rotationAngle = Math.PI * 2, steps = 36, center = BABYLON.Vector3.Zero()) {
        this.scene = scene;
        this.baseMesh = baseMesh;
        this.rotationAxis = rotationAxis;
        this.rotationAngle = rotationAngle;
        this.steps = steps;
        this.center = center;

        this.sweptMesh = this.createSweptMesh();
        this.createUIControls();
    }

    /**
     * Creates the swept mesh by rotating the base mesh around the specified axis.
     * @returns {BABYLON.Mesh} The created swept mesh.
     */
    createSweptMesh() {
        const positions = this.baseMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const indices = this.baseMesh.getIndices();
        const newPositions = [];
        const newIndices = [];
        const stepAngle = this.rotationAngle / this.steps;

        for (let step = 0; step <= this.steps; step++) {
            const angle = step * stepAngle;
            const rotationMatrix = BABYLON.Matrix.RotationAxis(this.rotationAxis, angle);

            for (let i = 0; i < positions.length; i += 3) {
                const vertex = BABYLON.Vector3.TransformCoordinates(
                    new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]).subtract(this.center),
                    rotationMatrix
                ).add(this.center);
                newPositions.push(vertex.x, vertex.y, vertex.z);
            }

            if (step > 0) {
                const baseIndex = step * (positions.length / 3);
                const prevBaseIndex = (step - 1) * (positions.length / 3);

                for (let i = 0; i < indices.length; i += 3) {
                    const i0 = indices[i];
                    const i1 = indices[i + 1];
                    const i2 = indices[i + 2];

                    newIndices.push(prevBaseIndex + i0, prevBaseIndex + i1, prevBaseIndex + i2);
                    newIndices.push(baseIndex + i0, baseIndex + i1, baseIndex + i2);
                    newIndices.push(prevBaseIndex + i0, baseIndex + i1, prevBaseIndex + i2);
                    newIndices.push(prevBaseIndex + i1, baseIndex + i1, baseIndex + i0);
                }
            }
        }

        // Calculate normals
        const normals = [];
        BABYLON.VertexData.ComputeNormals(newPositions, newIndices, normals);

        // Generate UV coordinates (simplified example)
        const uvs = [];
        for (let i = 0; i <= this.steps; i++) {
            for (let j = 0; j < positions.length / 3; j++) {
                uvs.push(j / (positions.length / 3 - 1), i / this.steps);
            }
        }

        const sweptMesh = new BABYLON.Mesh("sweptMesh", this.scene);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = newPositions;
        vertexData.indices = newIndices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        vertexData.applyToMesh(sweptMesh);

        return sweptMesh;
    }

    /**
     * Creates the UI controls for adjusting the rotation angle, steps, and axis.
     */
    createUIControls() {
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const panel = new StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        advancedTexture.addControl(panel);

        const stepsSlider = new Slider();
        stepsSlider.minimum = 3;
        stepsSlider.maximum = 100;
        stepsSlider.value = this.steps;
        stepsSlider.height = "20px";
        stepsSlider.width = "200px";
        stepsSlider.onValueChangedObservable.add(value => {
            this.steps = Math.floor(value);
            this.sweptMesh.dispose();
            this.sweptMesh = this.createSweptMesh();
        });
        panel.addControl(stepsSlider);

        const stepsText = new TextBlock();
        stepsText.text = "Rotation Steps";
        stepsText.height = "30px";
        stepsText.color = "white";
        panel.addControl(stepsText);

        const angleSlider = new Slider();
        angleSlider.minimum = 0;
        angleSlider.maximum = Math.PI * 4;
        angleSlider.value = this.rotationAngle;
        angleSlider.height = "20px";
        angleSlider.width = "200px";
        angleSlider.onValueChangedObservable.add(value => {
            this.rotationAngle = value;
            this.sweptMesh.dispose();
            this.sweptMesh = this.createSweptMesh();
        });
        panel.addControl(angleSlider);

        const angleText = new TextBlock();
        angleText.text = "Rotation Angle";
        angleText.height = "30px";
        angleText.color = "white";
        panel.addControl(angleText);

        const createButton = (text, axis) => {
            const button = new BABYLON.GUI.Button.CreateSimpleButton(text, text);
            button.width = "100px";
            button.height = "50px";
            button.color = "white";
            button.background = "gray";
            button.onPointerUpObservable.add(() => {
                this.rotationAxis = axis;
                this.sweptMesh.dispose();
                this.sweptMesh = this.createSweptMesh();
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
    }
}