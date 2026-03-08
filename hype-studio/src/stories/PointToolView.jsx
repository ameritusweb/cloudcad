import React, { useState } from 'react';
import { VertexData } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

export const PointToolView = () => {
  const model = useHypeStudioModel();
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const shapes = useHypeStudioState('elements.shapes', {});

  const [point, setPoint] = useState({ x: 0, y: 3, z: 0 });

  const selectedShape = selectedElementId ? shapes[selectedElementId] : null;

  const handleApply = () => {
    if (!selectedShape?.geometry) return;

    const basePositions = selectedShape.geometry.positions;
    const baseIndices = selectedShape.geometry.indices;
    const { x, y, z } = point;

    // New positions: extrusion point first, then base vertices
    const newPositions = [x, y, z, ...basePositions];
    const newIndices = [];
    const pointIndex = 0;

    // Connect each edge of the base mesh to the extrusion point
    for (let i = 0; i < baseIndices.length - 1; i++) {
      const i0 = baseIndices[i] + 1; // +1 because extrusion point is at index 0
      const i1 = baseIndices[i + 1] + 1;
      newIndices.push(pointIndex, i0, i1);
    }
    // Close the loop
    if (baseIndices[0] !== baseIndices[baseIndices.length - 1]) {
      newIndices.push(pointIndex, baseIndices[baseIndices.length - 1] + 1, baseIndices[0] + 1);
    }

    const normals = [];
    VertexData.ComputeNormals(newPositions, newIndices, normals);

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
      <h3 className="text-lg font-semibold text-gray-700">Point Tool</h3>
      {!selectedShape?.geometry && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Select a shape in the viewport to extrude to a point.
        </p>
      )}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <p className="text-xs text-gray-500">Extrude all faces of the selected mesh toward a single point in 3D space.</p>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Extrusion Point</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(ax => (
              <div key={ax}>
                <label className="text-xs text-gray-500">{ax.toUpperCase()}</label>
                <input type="number" value={point[ax]} step={0.1}
                  onChange={e => setPoint(p => ({ ...p, [ax]: parseFloat(e.target.value) }))}
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
        Apply Point Extrusion
      </button>
    </div>
  );
};
