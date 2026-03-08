import { Matrix, Vector3 } from '@babylonjs/core';
import { AdvancedDynamicTexture, InputText, Rectangle, TextBlock, Control } from '@babylonjs/gui';

/**
 * Create a fullscreen Babylon GUI texture for dimension labels.
 * Returns the AdvancedDynamicTexture instance.
 */
export const createDimensionUI = (scene) => {
  return AdvancedDynamicTexture.CreateFullscreenUI('dimensionUI', true, scene);
};

/**
 * Project a 3D world point to 2D screen-space [0-1] coordinates.
 */
const worldToScreen = (worldPoint, scene) => {
  const viewport = scene.activeCamera.viewport.toGlobal(
    scene.getEngine().getRenderWidth(),
    scene.getEngine().getRenderHeight()
  );
  const projected = Vector3.Project(
    worldPoint,
    Matrix.Identity(),
    scene.getTransformMatrix(),
    viewport
  );
  const engine = scene.getEngine();
  return {
    x: projected.x / engine.getRenderWidth(),
    y: projected.y / engine.getRenderHeight(),
  };
};

/**
 * Show a dimension input control near `worldPoint`.
 *
 * @param {AdvancedDynamicTexture} advancedTexture
 * @param {Vector3} worldPoint - 3D world position to anchor the label
 * @param {BABYLON.Scene} scene
 * @param {string} currentLabel - Current value shown as placeholder
 * @param {function} onConfirm - Called with the parsed float value when Enter is pressed
 * @returns {Rectangle} The container control (pass to hideDimensionInput to remove)
 */
export const showDimensionInput = (advancedTexture, worldPoint, scene, currentLabel, onConfirm) => {
  // Container
  const container = new Rectangle('dimContainer');
  container.width = '90px';
  container.height = '28px';
  container.cornerRadius = 4;
  container.color = '#2563eb';
  container.thickness = 2;
  container.background = 'white';
  container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

  // Label showing the property name
  const label = new TextBlock('dimLabel');
  label.text = currentLabel + ':';
  label.color = '#374151';
  label.fontSize = 10;
  label.width = '28px';
  label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  label.paddingLeft = '4px';
  container.addControl(label);

  // Input field
  const input = new InputText('dimInput');
  input.width = '58px';
  input.height = '24px';
  input.color = '#111827';
  input.background = 'white';
  input.fontSize = 12;
  input.placeholderText = '0';
  input.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  input.focusedBackground = '#eff6ff';
  container.addControl(input);

  advancedTexture.addControl(container);

  // Position near the world point
  const positionContainer = () => {
    if (!scene.activeCamera) return;
    const screen = worldToScreen(worldPoint, scene);
    // Offset slightly so it doesn't sit exactly on the geometry
    container.left = `${Math.round(screen.x * scene.getEngine().getRenderWidth()) + 10}px`;
    container.top = `${Math.round(screen.y * scene.getEngine().getRenderHeight()) - 14}px`;
  };
  positionContainer();

  // Listen for Enter key
  input.onKeyboardEventProcessedObservable.add((evt) => {
    if (evt.key === 'Enter') {
      const val = parseFloat(input.text);
      if (!isNaN(val) && val > 0) {
        onConfirm(val);
      }
      advancedTexture.removeControl(container);
      container.dispose();
    }
    if (evt.key === 'Escape') {
      advancedTexture.removeControl(container);
      container.dispose();
    }
  });

  // Auto-focus
  advancedTexture.moveFocusToControl(input);

  return container;
};

/**
 * Remove and dispose a dimension input container.
 */
export const hideDimensionInput = (advancedTexture, container) => {
  if (container) {
    advancedTexture.removeControl(container);
    container.dispose();
  }
};
