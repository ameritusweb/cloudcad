import React, { useState } from 'react';
import { MeshBuilder, VertexBuffer, VertexData, Vector3 } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';

const AXES = ['X', 'Y', 'Z'];

export const CrushToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();

  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [depth, setDepth] = useState(2);
  const [segments, setSegments] = useState(8);
  const [materialStrength, setMaterialStrength] = useState(1.0);
  const [elasticity, setElasticity] = useState(0.5);
  const [forceMagnitude, setForceMagnitude] = useState(3);
  const [forceAxis, setForceAxis] = useState('Y');

  const handleApply = () => {
    const tempScene = getTempScene();
    const mesh = MeshBuilder.CreateBox('crushBox', { width, height, depth, subdivisions: segments }, tempScene);

    const positions = mesh.getVerticesData(VertexBuffer.PositionKind).slice();

    // Force from top centre, direction along negative forceAxis
    const forcePos = new Vector3(0, height / 2, 0);
    const forceDir = forceAxis === 'X' ? new Vector3(-1, 0, 0)
      : forceAxis === 'Z' ? new Vector3(0, 0, -1)
      : new Vector3(0, -1, 0);
    const forceVec = forceDir.scale(forceMagnitude);
    const influenceRadius = width / 2;
    const sigma = width / 4;

    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const dist = Vector3.Distance(forcePos, vertex);
      if (dist < influenceRadius) {
        const factor = Math.exp(-dist * dist / (2 * sigma * sigma)) * materialStrength;
        positions[i]     += forceVec.x * factor * elasticity;
        positions[i + 1] += forceVec.y * factor * elasticity;
        positions[i + 2] += forceVec.z * factor * elasticity;
      }
    }

    const indices = Array.from(mesh.getIndices());
    const normals = [];
    VertexData.ComputeNormals(positions, indices, normals);
    mesh.dispose();

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
            geometry: { positions: Array.from(positions), indices, normals, uvs: null },
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scaling: [1, 1, 1] }
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Crush Tool</h3>
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'W', value: width, set: setWidth },
            { label: 'H', value: height, set: setHeight },
            { label: 'D', value: depth, set: setDepth },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs text-gray-500">{label}</label>
              <input type="number" value={value} min={0.1} step={0.1}
                onChange={e => set(parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Segments: {segments}</label>
          <input type="range" min={2} max={20} step={1} value={segments}
            onChange={e => setSegments(parseInt(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Material Strength: {materialStrength.toFixed(1)}
          </label>
          <input type="range" min={0.1} max={2} step={0.1} value={materialStrength}
            onChange={e => setMaterialStrength(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Elasticity: {elasticity.toFixed(2)}
          </label>
          <input type="range" min={0.1} max={1} step={0.01} value={elasticity}
            onChange={e => setElasticity(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Force Magnitude: {forceMagnitude.toFixed(1)}
          </label>
          <input type="range" min={0} max={10} step={0.1} value={forceMagnitude}
            onChange={e => setForceMagnitude(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Force Direction</label>
          <div className="flex gap-2">
            {AXES.map(axis => (
              <button key={axis} onClick={() => setForceAxis(axis)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${forceAxis === axis ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                -{axis}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
        Apply Crush
      </button>
    </div>
  );
};
