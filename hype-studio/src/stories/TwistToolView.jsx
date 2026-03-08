import React, { useState } from 'react';
import { MeshBuilder, VertexBuffer, VertexData, Axis } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';

const AXES = ['X', 'Y', 'Z'];
const MAX_TWIST = Math.PI * 4;

export const TwistToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();

  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(4);
  const [segments, setSegments] = useState(20);
  const [twistAmount, setTwistAmount] = useState(Math.PI);
  const [twistAxis, setTwistAxis] = useState('Y');
  const [twistExponent, setTwistExponent] = useState(1);

  const handleApply = () => {
    const tempScene = getTempScene();
    const mesh = MeshBuilder.CreatePlane('twistPlane', { width, height, subdivisions: segments }, tempScene);

    const positions = mesh.getVerticesData(VertexBuffer.PositionKind).slice();
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const idx = (i * (segments + 1) + j) * 3;
        const x = positions[idx] - halfWidth;
        const y = positions[idx + 1] - halfHeight;
        const z = positions[idx + 2];

        const norm = twistAxis === 'X' ? (x + halfWidth) / width
          : twistAxis === 'Z' ? (z + halfWidth) / width
          : (y + halfHeight) / height;
        const angle = Math.pow(norm, twistExponent) * twistAmount;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        if (twistAxis === 'X') {
          positions[idx + 1] = y * cos - z * sin + halfHeight;
          positions[idx + 2] = y * sin + z * cos;
        } else if (twistAxis === 'Z') {
          positions[idx] = x * cos - y * sin + halfWidth;
          positions[idx + 1] = x * sin + y * cos;
        } else {
          positions[idx] = x * cos - z * sin + halfWidth;
          positions[idx + 2] = x * sin + z * cos;
        }
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
      <h3 className="text-lg font-semibold text-gray-700">Twist Tool</h3>
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        {[
          { label: 'Width', value: width, set: setWidth, min: 0.1, step: 0.1 },
          { label: 'Height', value: height, set: setHeight, min: 0.1, step: 0.1 },
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
          <label className="text-sm font-medium text-gray-600">
            Twist Angle: {(twistAmount * 180 / Math.PI).toFixed(0)}°
          </label>
          <input type="range" min={0} max={MAX_TWIST} step={0.01} value={twistAmount}
            onChange={e => setTwistAmount(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">
            Twist Exponent: {twistExponent.toFixed(1)}
          </label>
          <input type="range" min={0.1} max={5} step={0.1} value={twistExponent}
            onChange={e => setTwistExponent(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Twist Axis</label>
          <div className="flex gap-2">
            {AXES.map(axis => (
              <button key={axis} onClick={() => setTwistAxis(axis)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${twistAxis === axis ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
        Apply Twist
      </button>
    </div>
  );
};
