import React, { useState } from 'react';
import { Mesh, VertexBuffer, VertexData, Matrix, Vector3 } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

const AXES = ['X', 'Y', 'Z'];

const axisVector = (axis) => axis === 'X' ? new Vector3(1, 0, 0) : axis === 'Y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);

export const SweepToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const shapes = useHypeStudioState('elements.shapes', {});

  const [rotationAxis, setRotationAxis] = useState('Y');
  const [rotationAngle, setRotationAngle] = useState(Math.PI * 2);
  const [steps, setSteps] = useState(36);
  const [center, setCenter] = useState({ x: 0, y: 0, z: 0 });

  const selectedShape = selectedElementId ? shapes[selectedElementId] : null;

  const handleApply = () => {
    if (!selectedShape?.geometry) return;

    const tempScene = getTempScene();
    const baseMesh = new Mesh('sweepBase', tempScene);
    const baseVD = new VertexData();
    baseVD.positions = selectedShape.geometry.positions;
    baseVD.indices = selectedShape.geometry.indices;
    baseVD.normals = selectedShape.geometry.normals;
    baseVD.applyToMesh(baseMesh);

    const basePositions = baseMesh.getVerticesData(VertexBuffer.PositionKind);
    const baseIndices = baseMesh.getIndices();
    const centerVec = new Vector3(center.x, center.y, center.z);
    const axis = axisVector(rotationAxis);
    const stepAngle = rotationAngle / steps;

    const newPositions = [];
    const newIndices = [];

    for (let step = 0; step <= steps; step++) {
      const angle = step * stepAngle;
      const rotMatrix = Matrix.RotationAxis(axis, angle);
      for (let i = 0; i < basePositions.length; i += 3) {
        const v = Vector3.TransformCoordinates(
          new Vector3(basePositions[i], basePositions[i + 1], basePositions[i + 2]).subtract(centerVec),
          rotMatrix
        ).add(centerVec);
        newPositions.push(v.x, v.y, v.z);
      }
      if (step > 0) {
        const base = step * (basePositions.length / 3);
        const prev = (step - 1) * (basePositions.length / 3);
        for (let i = 0; i < baseIndices.length; i += 3) {
          const i0 = baseIndices[i], i1 = baseIndices[i + 1], i2 = baseIndices[i + 2];
          newIndices.push(prev + i0, prev + i1, prev + i2);
          newIndices.push(base + i0, base + i1, base + i2);
          newIndices.push(prev + i0, base + i1, prev + i2);
          newIndices.push(prev + i1, base + i1, base + i0);
        }
      }
    }

    const normals = [];
    VertexData.ComputeNormals(newPositions, newIndices, normals);
    baseMesh.dispose();

    const id = `shape_${Date.now()}`;
    model.setState(state => ({
      ...state,
      elements: {
        ...state.elements,
        shapes: {
          ...state.elements.shapes,
          [id]: {
            id,
            type: 'custom',
            geometry: { positions: newPositions, indices: newIndices, normals, uvs: null },
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scaling: [1, 1, 1] }
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Sweep Tool</h3>
      {!selectedShape?.geometry && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Select a shape in the viewport to use as the sweep profile.
        </p>
      )}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Rotation Angle: {(rotationAngle * 180 / Math.PI).toFixed(0)}°
          </label>
          <input type="range" min={0} max={Math.PI * 4} step={0.01} value={rotationAngle}
            onChange={e => setRotationAngle(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Steps: {steps}</label>
          <input type="range" min={3} max={100} step={1} value={steps}
            onChange={e => setSteps(parseInt(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Rotation Axis</label>
          <div className="flex gap-2">
            {AXES.map(axis => (
              <button key={axis} onClick={() => setRotationAxis(axis)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${rotationAxis === axis ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Center</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(ax => (
              <div key={ax}>
                <label className="text-xs text-gray-500">{ax.toUpperCase()}</label>
                <input type="number" value={center[ax]} step={0.1}
                  onChange={e => setCenter(c => ({ ...c, [ax]: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply} disabled={!selectedShape?.geometry}
        className={`w-full font-bold py-2 px-4 rounded-md transition-colors
          ${selectedShape?.geometry ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Apply Sweep
      </button>
    </div>
  );
};
