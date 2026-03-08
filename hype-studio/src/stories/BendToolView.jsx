import React, { useState } from 'react';
import { MeshBuilder, VertexBuffer, VertexData } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';

const AXES = ['X', 'Y', 'Z'];

export const BendToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();

  const [meshType, setMeshType] = useState('rectangle');
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(1);
  const [segments, setSegments] = useState(20);
  const [bendAmount, setBendAmount] = useState(0.5);
  const [bendAxis, setBendAxis] = useState('Z');

  const handleApply = () => {
    const tempScene = getTempScene();
    let mesh;
    if (meshType === 'rectangle') {
      mesh = MeshBuilder.CreatePlane('bendPlane', { width, height: length, subdivisions: segments }, tempScene);
    } else {
      mesh = MeshBuilder.CreateCylinder('bendCylinder', { height: length, diameter: width, tessellation: segments, subdivisions: segments }, tempScene);
    }

    const positions = mesh.getVerticesData(VertexBuffer.PositionKind).slice();
    const radius = bendAmount > 0 ? (length / Math.PI) * bendAmount : 0;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
      const bendCoord = bendAxis === 'X' ? x : bendAxis === 'Y' ? y : z;
      const angle = (bendCoord / length) * Math.PI * 2 * bendAmount;
      if (bendAxis === 'X') {
        positions[i + 1] = radius * Math.sin(angle);
        positions[i + 2] = radius * (1 - Math.cos(angle));
      } else if (bendAxis === 'Y') {
        positions[i] = radius * Math.sin(angle);
        positions[i + 2] = radius * (1 - Math.cos(angle));
      } else {
        positions[i] = radius * Math.sin(angle);
        positions[i + 1] = radius * (1 - Math.cos(angle));
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
      <h3 className="text-lg font-semibold text-gray-700">Bend Tool</h3>
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Mesh Type</label>
          <select
            value={meshType}
            onChange={e => setMeshType(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="rectangle">Rectangle</option>
            <option value="cylinder">Cylinder</option>
          </select>
        </div>
        {[
          { label: 'Length', value: length, set: setLength, min: 0.1, step: 0.1 },
          { label: 'Width', value: width, set: setWidth, min: 0.1, step: 0.1 },
          { label: 'Segments', value: segments, set: v => setSegments(Math.round(v)), min: 2, step: 1 },
        ].map(({ label, value, set, min, step }) => (
          <div key={label}>
            <label className="text-sm font-medium text-gray-600">{label}: {value}</label>
            <input type="number" value={value} min={min} step={step}
              onChange={e => set(parseFloat(e.target.value))}
              className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-gray-600">Bend Amount: {bendAmount.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={bendAmount}
            onChange={e => setBendAmount(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Bend Axis</label>
          <div className="flex gap-2">
            {AXES.map(axis => (
              <button key={axis} onClick={() => setBendAxis(axis)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${bendAxis === axis ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
        Apply Bend
      </button>
    </div>
  );
};
