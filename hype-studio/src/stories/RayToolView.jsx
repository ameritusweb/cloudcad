import React, { useState } from 'react';
import { Mesh, VertexBuffer, VertexData, Vector3, Ray, MeshBuilder } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

export const RayToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();
  const shapes = useHypeStudioState('elements.shapes', {});
  const sketches = useHypeStudioState('elements.sketches', {});

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [rayDir, setRayDir] = useState({ x: 0, y: -1, z: 0 });

  const allShapes = Object.values(shapes);
  const sourceOptions = [...Object.values(sketches), ...allShapes];
  const targetOptions = allShapes;

  const handleApply = () => {
    const sourceShape = shapes[sourceId] || sketches[sourceId];
    const targetShape = shapes[targetId];
    if (!sourceShape?.geometry || !targetShape?.geometry) return;

    const tempScene = getTempScene();

    // Reconstruct target mesh in tempScene for ray intersection
    const targetMesh = new Mesh('rayTarget', tempScene);
    const targetVD = new VertexData();
    targetVD.positions = targetShape.geometry.positions;
    targetVD.indices = targetShape.geometry.indices;
    targetVD.normals = targetShape.geometry.normals;
    targetVD.applyToMesh(targetMesh);

    const direction = new Vector3(rayDir.x, rayDir.y, rayDir.z).normalize();
    const sourcePositions = sourceShape.geometry.positions;
    const projectedPoints = [];

    for (let i = 0; i < sourcePositions.length; i += 3) {
      const origin = new Vector3(sourcePositions[i], sourcePositions[i + 1], sourcePositions[i + 2]);
      const ray = new Ray(origin, direction, 1000);
      const hit = targetMesh.intersects(ray);
      if (hit.hit && hit.pickedPoint) {
        projectedPoints.push(hit.pickedPoint);
      }
    }

    targetMesh.dispose();

    if (projectedPoints.length < 3) return;

    // Build a line mesh from the projected points
    const newPositions = [];
    const newIndices = [];
    projectedPoints.forEach(p => newPositions.push(p.x, p.y, p.z));
    for (let i = 0; i < projectedPoints.length - 1; i++) {
      newIndices.push(i, i + 1, i);
    }
    if (projectedPoints.length >= 3) {
      // Fan triangulate from first point
      newIndices.length = 0;
      for (let i = 1; i < projectedPoints.length - 1; i++) {
        newIndices.push(0, i, i + 1);
      }
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

  const canApply = sourceId && targetId && sourceId !== targetId
    && (shapes[sourceId]?.geometry || sketches[sourceId]?.geometry)
    && shapes[targetId]?.geometry;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Ray Tool</h3>
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <p className="text-xs text-gray-500">Project a source sketch or shape onto a target mesh along a ray direction.</p>
        <div>
          <label className="text-sm font-medium text-gray-600">Source (sketch / shape)</label>
          <select value={sourceId} onChange={e => setSourceId(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm">
            <option value="">— select —</option>
            {sourceOptions.map(s => (
              <option key={s.id} value={s.id}>{s.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Target mesh</label>
          <select value={targetId} onChange={e => setTargetId(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm">
            <option value="">— select —</option>
            {targetOptions.map(s => (
              <option key={s.id} value={s.id}>{s.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Ray Direction</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(ax => (
              <div key={ax}>
                <label className="text-xs text-gray-500">{ax.toUpperCase()}</label>
                <input type="number" value={rayDir[ax]} step={0.1} min={-1} max={1}
                  onChange={e => setRayDir(d => ({ ...d, [ax]: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply} disabled={!canApply}
        className={`w-full font-bold py-2 px-4 rounded-md transition-colors
          ${canApply ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Project onto Mesh
      </button>
    </div>
  );
};
