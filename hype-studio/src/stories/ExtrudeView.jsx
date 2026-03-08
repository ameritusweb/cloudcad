import React, { useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';

const DIRECTIONS = [
  { label: '+Z', value: 1 },
  { label: '-Z', value: -1 },
];

/**
 * Convert a stored sketch to a flat polygon array [{x, y}] for ExtrudeShape.
 * All coordinates are relative to world origin; ExtrudeShape places the shape
 * at its own origin so we use sketch-relative coords.
 */
const sketchToPolygon = (sketch, tessellation) => {
  if (!sketch) return null;

  if (sketch.type === 'circle') {
    const { center, radius } = sketch;
    return Array.from({ length: tessellation }, (_, i) => {
      const angle = (i / tessellation) * Math.PI * 2;
      return {
        x: (center?.x ?? 0) + radius * Math.cos(angle),
        y: (center?.y ?? 0) + radius * Math.sin(angle),
      };
    });
  }

  if (sketch.type === 'rectangle') {
    const cx = sketch.center?.x ?? 0;
    const cy = sketch.center?.y ?? 0;
    const hw = sketch.width / 2;
    const hh = sketch.height / 2;
    return [
      { x: cx - hw, y: cy - hh },
      { x: cx + hw, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ];
  }

  // Generic sketch with a geometry array [{x, y}]
  if (Array.isArray(sketch.geometry) && sketch.geometry.length >= 3) {
    return sketch.geometry;
  }

  return null;
};

export const ExtrudeView = () => {
  const model = useHypeStudioModel();
  const sketches = useHypeStudioState('elements.sketches', {});

  const [selectedSketchId, setSelectedSketchId] = useState('');
  const [depth, setDepth] = useState(1);
  const [direction, setDirection] = useState(1);
  const [tessellation, setTessellation] = useState(32);

  const sketchList = Object.values(sketches);
  const selectedSketch = sketches[selectedSketchId];
  const isCircle = selectedSketch?.type === 'circle';

  const handleApply = () => {
    if (!selectedSketchId || !selectedSketch) return;

    const polygon = sketchToPolygon(selectedSketch, tessellation);
    if (!polygon) return;

    const id = `extrusion_${Date.now()}`;
    model.setState(state => ({
      ...state,
      elements: {
        ...state.elements,
        extrusions: {
          ...state.elements.extrusions,
          [id]: {
            id,
            baseSketchId: selectedSketchId,
            depth: depth * direction,
            sketchGeometry: polygon,
            customProperties: {},
          },
        },
      },
      selectedElementId: id,
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Extrude View</h3>

      {sketchList.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          No sketches yet. Draw a circle or rectangle in Sketch View first.
        </p>
      )}

      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Base Sketch</label>
          <select
            value={selectedSketchId}
            onChange={e => setSelectedSketchId(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="">— select sketch —</option>
            {sketchList.map(s => (
              <option key={s.id} value={s.id}>
                {s.type} — {s.id.slice(-6)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Depth: {depth.toFixed(2)}</label>
          <input
            type="range" min={0.05} max={20} step={0.05} value={depth}
            onChange={e => setDepth(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
          <input
            type="number" value={depth} min={0.05} step={0.05}
            onChange={e => setDepth(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Direction</label>
          <div className="flex gap-2">
            {DIRECTIONS.map(d => (
              <button key={d.value} onClick={() => setDirection(d.value)}
                className={`flex-1 py-1 rounded-md text-sm font-bold border transition-colors
                  ${direction === d.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {isCircle && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Circle Tessellation: {tessellation}
            </label>
            <input
              type="range" min={8} max={128} step={4} value={tessellation}
              onChange={e => setTessellation(parseInt(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleApply}
        disabled={!selectedSketchId || !selectedSketch}
        className={`w-full font-bold py-2 px-4 rounded-md transition-colors
          ${selectedSketchId && selectedSketch
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Extrude
      </button>
    </div>
  );
};
