import React, { useState } from 'react';
import { Mesh, VertexBuffer, VertexData, Vector3, Vector2 } from '@babylonjs/core';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioEngines } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

const AXES = ['X', 'Y', 'Z'];

const axisNormal = (axis) => axis === 'X' ? new Vector3(1, 0, 0) : axis === 'Y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);

export const SliceToolView = () => {
  const model = useHypeStudioModel();
  const { getTempScene } = useHypeStudioEngines();
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const shapes = useHypeStudioState('elements.shapes', {});

  const [planeAxis, setPlaneAxis] = useState('Y');
  const [planeOffset, setPlaneOffset] = useState(0);
  const [keepSideA, setKeepSideA] = useState(true);

  const selectedShape = selectedElementId ? shapes[selectedElementId] : null;

  const handleApply = () => {
    if (!selectedShape?.geometry) return;

    const normal = axisNormal(planeAxis);
    const slicePlane = {
      signedDistanceTo: (point) => Vector3.Dot(point, normal) - planeOffset
    };

    const positions = selectedShape.geometry.positions;
    const indices = selectedShape.geometry.indices;
    const normals = selectedShape.geometry.normals;
    const uvs = selectedShape.geometry.uvs;

    const newPositions = [];
    const newIndices = [];
    const newNormals = [];
    const newUVs = [];
    const vertexMap = new Map();

    const addVertex = (vertex, normal, uv) => {
      const key = `${vertex.x.toFixed(6)},${vertex.y.toFixed(6)},${vertex.z.toFixed(6)}`;
      if (!vertexMap.has(key)) {
        const idx = newPositions.length / 3;
        vertexMap.set(key, idx);
        newPositions.push(vertex.x, vertex.y, vertex.z);
        newNormals.push(normal.x, normal.y, normal.z);
        if (uvs) newUVs.push(uv.x, uv.y);
      }
      return vertexMap.get(key);
    };

    const interpV3 = (v1, v2, d1, d2) => {
      const t = d1 / (d1 - d2);
      return new Vector3(v1.x + (v2.x - v1.x) * t, v1.y + (v2.y - v1.y) * t, v1.z + (v2.z - v1.z) * t);
    };
    const interpV2 = (v1, v2, d1, d2) => {
      const t = d1 / (d1 - d2);
      return new Vector2(v1.x + (v2.x - v1.x) * t, v1.y + (v2.y - v1.y) * t);
    };

    const triIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
      const [ai, bi, ci] = [indices[i], indices[i + 1], indices[i + 2]];
      const verts = [ai, bi, ci].map(idx => new Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]));
      const norms = [ai, bi, ci].map(idx => new Vector3(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]));
      const uvArr = uvs ? [ai, bi, ci].map(idx => new Vector2(uvs[idx * 2], uvs[idx * 2 + 1])) : null;
      const dists = verts.map(v => slicePlane.signedDistanceTo(v));

      const sides = dists.map(d => keepSideA ? d >= 0 : d < 0);
      const inside = sides.filter(Boolean).length;
      if (inside === 0) continue;

      const getOrAdd = (vi) => addVertex(verts[vi], norms[vi], uvArr ? uvArr[vi] : new Vector2(0, 0));
      const getIntersect = (vi, vj) => {
        const ip = interpV3(verts[vi], verts[vj], dists[vi], dists[vj]);
        const in_ = interpV3(norms[vi], norms[vj], dists[vi], dists[vj]);
        const iu = uvArr ? interpV2(uvArr[vi], uvArr[vj], dists[vi], dists[vj]) : new Vector2(0, 0);
        return addVertex(ip, in_, iu);
      };

      if (inside === 3) {
        triIndices.push(getOrAdd(0), getOrAdd(1), getOrAdd(2));
      } else if (inside === 2) {
        // Two verts inside
        const out = sides.findIndex(s => !s);
        const a = (out + 1) % 3, b = (out + 2) % 3;
        const ia = getOrAdd(a), ib = getOrAdd(b);
        const ioa = getIntersect(out, a), iob = getIntersect(out, b);
        triIndices.push(ia, ib, ioa);
        triIndices.push(ioa, ib, iob);
      } else {
        // One vert inside
        const ins = sides.findIndex(s => s);
        const a = (ins + 1) % 3, b = (ins + 2) % 3;
        const ii = getOrAdd(ins);
        const iia = getIntersect(ins, a), iib = getIntersect(ins, b);
        triIndices.push(ii, iia, iib);
      }
    }

    if (triIndices.length === 0) return;

    const recomputedNormals = [];
    VertexData.ComputeNormals(newPositions, triIndices, recomputedNormals);

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
            geometry: { positions: newPositions, indices: triIndices, normals: recomputedNormals, uvs: newUVs.length ? newUVs : null },
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scaling: [1, 1, 1] }
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Slice Tool</h3>
      {!selectedShape?.geometry && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          Select a shape in the viewport to slice.
        </p>
      )}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Slice Plane Normal</label>
          <div className="flex gap-2">
            {AXES.map(axis => (
              <button key={axis} onClick={() => setPlaneAxis(axis)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${planeAxis === axis ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {axis}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Plane Offset: {planeOffset.toFixed(2)}</label>
          <input type="range" min={-5} max={5} step={0.05} value={planeOffset}
            onChange={e => setPlaneOffset(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Keep Side</label>
          <div className="flex gap-2">
            {[true, false].map(side => (
              <button key={String(side)} onClick={() => setKeepSideA(side)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${keepSideA === side ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {side ? 'Positive' : 'Negative'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleApply} disabled={!selectedShape?.geometry}
        className={`w-full font-bold py-2 px-4 rounded-md transition-colors
          ${selectedShape?.geometry ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Apply Slice
      </button>
    </div>
  );
};
