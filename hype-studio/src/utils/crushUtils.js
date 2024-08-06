import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Slider, StackPanel, TextBlock, Button } from '@babylonjs/gui';

/**
 * Represents a force applied to the mesh, including position, direction, and magnitude.
 */
export class Force {
    constructor(position, direction, magnitude) {
        this.position = position;
        this.direction = direction;
        this.magnitude = magnitude;
    }
}

/**
 * Utility class for simulating crushing of a mesh due to applied forces.
 */
export class CrushUtils {
    /**
     * Creates an instance of CrushUtils.
     * @param {BABYLON.Scene} scene - The Babylon.js scene.
     * @param {number} width - The width of the mesh.
     * @param {number} height - The height of the mesh.
     * @param {number} depth - The depth of the mesh.
     * @param {number} segments - The number of segments for subdivisions.
     * @param {number} materialStrength - The strength of the material (default: 1.0).
     * @param {number} elasticity - The elasticity of the material (default: 0.5).
     */
    constructor(scene, width, height, depth, segments, materialStrength = 1.0, elasticity = 0.5) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.segments = segments;
        this.materialStrength = materialStrength;
        this.elasticity = elasticity;
        this.forces = [];

        this.mesh = this.createMesh();
        this.createUIControls();
    }

    /**
     * Creates the initial box mesh.
     * @returns {BABYLON.Mesh} The created box mesh.
     */
    createMesh() {
        return BABYLON.MeshBuilder.CreateBox("crushableBox", {
            width: this.width,
            height: this.height,
            depth: this.depth,
            subdivisions: this.segments
        }, this.scene);
    }

    /**
     * Applies all the forces to the mesh, deforming it accordingly.
     */
    applyForces() {
        const positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const originalPositions = [...positions];

        for (const force of this.forces) {
            const forceVector = force.direction.normalize().scale(force.magnitude);

            for (let i = 0; i < positions.length; i += 3) {
                const vertex = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const distance = BABYLON.Vector3.Distance(force.position, vertex);

                if (distance < this.width / 2) {
                    const deformation = forceVector.scale(
                        Math.exp(-distance * distance / (2 * Math.pow(this.width / 4, 2))) * this.materialStrength
                    );

                    positions[i] += deformation.x * this.elasticity;
                    positions[i + 1] += deformation.y * this.elasticity;
                    positions[i + 2] += deformation.z * this.elasticity;
                }
            }
        }

        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    }

    /**
     * Adds a new force to the list of applied forces and updates the mesh.
     * @param {BABYLON.Vector3} position - The position where the force is applied.
     * @param {BABYLON.Vector3} direction - The direction of the applied force.
     * @param {number} magnitude - The magnitude of the applied force.
     */
    addForce(position, direction, magnitude) {
        this.forces.push(new Force(position, direction, magnitude));
        this.applyForces();
    }

    /**
     * Creates the UI controls for adjusting force parameters and material properties.
     */
    createUIControls() {
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const panel = new StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        advancedTexture.addControl(panel);

        const forceSlider = new Slider();
        forceSlider.minimum = 0;
        forceSlider.maximum = 10;
        forceSlider.value = 1;
        forceSlider.height = "20px";
        forceSlider.width = "200px";
        forceSlider.onValueChangedObservable.add(value => {
            this.forceMagnitude = value;
        });
        panel.addControl(forceSlider);

        const forceText = new TextBlock();
        forceText.text = "Force Magnitude";
        forceText.height = "30px";
        forceText.color = "white";
        panel.addControl(forceText);

        const materialSlider = new Slider();
        materialSlider.minimum = 0.1;
        materialSlider.maximum = 2.0;
        materialSlider.value = this.materialStrength;
        materialSlider.height = "20px";
        materialSlider.width = "200px";
        materialSlider.onValueChangedObservable.add(value => {
            this.materialStrength = value;
        });
        panel.addControl(materialSlider);

        const materialText = new TextBlock();
        materialText.text = "Material Strength";
        materialText.height = "30px";
        materialText.color = "white";
        panel.addControl(materialText);

        const elasticitySlider = new Slider();
        elasticitySlider.minimum = 0.1;
        elasticitySlider.maximum = 1.0;
        elasticitySlider.value = this.elasticity;
        elasticitySlider.height = "20px";
        elasticitySlider.width = "200px";
        elasticitySlider.onValueChangedObservable.add(value => {
            this.elasticity = value;
        });
        panel.addControl(elasticitySlider);

        const elasticityText = new TextBlock();
        elasticityText.text = "Elasticity";
        elasticityText.height = "30px";
        elasticityText.color = "white";
        panel.addControl(elasticityText);

        const addForceButton = Button.CreateSimpleButton("addForceButton", "Add Force");
        addForceButton.width = "150px";
        addForceButton.height = "40px";
        addForceButton.color = "white";
        addForceButton.background = "red";
        addForceButton.onPointerClickObservable.add(() => {
            const forcePosition = new BABYLON.Vector3(0, 0, this.depth / 2); // Example position
            const forceDirection = new BABYLON.Vector3(0, -1, 0); // Example force direction
            const forceMagnitude = this.forceMagnitude;
            this.addForce(forcePosition, forceDirection, forceMagnitude);
        });
        panel.addControl(addForceButton);
    }
}