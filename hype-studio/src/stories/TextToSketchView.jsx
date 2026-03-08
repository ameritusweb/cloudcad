import React, { useState, useCallback } from 'react';
import opentype from 'opentype.js';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

const DEFAULT_FONT_URL =
  'https://cdn.jsdelivr.net/gh/opentypejs/opentype.js@main/test/fonts/FiraSansMedium.ttf';

const CURVE_STEPS = 12;

/** Sample a cubic bezier from p0→p1→p2→p3 */
const sampleCubic = (p0, p1, p2, p3) => {
  const pts = [];
  for (let i = 1; i <= CURVE_STEPS; i++) {
    const t = i / CURVE_STEPS;
    const mt = 1 - t;
    pts.push({
      x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
      y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
    });
  }
  return pts;
};

/** Sample a quadratic bezier from p0→p1→p2 */
const sampleQuad = (p0, p1, p2) => {
  const pts = [];
  for (let i = 1; i <= CURVE_STEPS; i++) {
    const t = i / CURVE_STEPS;
    const mt = 1 - t;
    pts.push({
      x: mt ** 2 * p0.x + 2 * mt * t * p1.x + t ** 2 * p2.x,
      y: mt ** 2 * p0.y + 2 * mt * t * p1.y + t ** 2 * p2.y,
    });
  }
  return pts;
};

/**
 * Extract closed contours from an opentype.js Path as [{x, y}] arrays.
 * Y is flipped from screen-space to Babylon Y-up space.
 */
const extractContours = (opentypePath) => {
  const contours = [];
  let current = [];
  let startPt = null;

  opentypePath.commands.forEach(cmd => {
    switch (cmd.type) {
      case 'M': {
        if (current.length > 2) contours.push(current);
        const pt = { x: cmd.x, y: -cmd.y };
        current = [pt];
        startPt = pt;
        break;
      }
      case 'L': {
        current.push({ x: cmd.x, y: -cmd.y });
        break;
      }
      case 'C': {
        const prev = current[current.length - 1];
        const pts = sampleCubic(
          { x: prev.x, y: -prev.y },
          { x: cmd.x1, y: -cmd.y1 },
          { x: cmd.x2, y: -cmd.y2 },
          { x: cmd.x,  y: -cmd.y  }
        );
        pts.forEach(p => current.push({ x: p.x, y: p.y }));
        break;
      }
      case 'Q': {
        const prev = current[current.length - 1];
        const pts = sampleQuad(
          { x: prev.x, y: -prev.y },
          { x: cmd.x1, y: -cmd.y1 },
          { x: cmd.x,  y: -cmd.y  }
        );
        pts.forEach(p => current.push({ x: p.x, y: p.y }));
        break;
      }
      case 'Z': {
        if (startPt) current.push({ ...startPt });
        if (current.length > 2) contours.push(current);
        current = [];
        startPt = null;
        break;
      }
    }
  });

  if (current.length > 2) contours.push(current);
  return contours;
};

export const TextToSketchView = () => {
  const model = useHypeStudioModel();

  const [text, setText] = useState('Hello');
  const [fontSize, setFontSize] = useState(72);
  const [fontUrl, setFontUrl] = useState(DEFAULT_FONT_URL);
  const [font, setFont] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contourCount, setContourCount] = useState(null);

  const handleLoadFont = useCallback(async () => {
    setLoading(true);
    setError('');
    setFont(null);
    setContourCount(null);
    try {
      const loaded = await new Promise((resolve, reject) => {
        opentype.load(fontUrl.trim(), (err, f) => {
          if (err) reject(err);
          else resolve(f);
        });
      });
      setFont(loaded);
    } catch (err) {
      setError(`Could not load font: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [fontUrl]);

  const handlePreview = useCallback(() => {
    if (!font) return;
    const path = font.getPath(text, 0, 0, fontSize);
    const contours = extractContours(path);
    setContourCount(contours.length);
  }, [font, text, fontSize]);

  const handleCreateSketches = useCallback(() => {
    if (!font) return;
    const path = font.getPath(text, 0, 0, fontSize);
    const contours = extractContours(path);
    if (contours.length === 0) return;

    const now = Date.now();
    const newSketches = {};
    contours.forEach((pts, i) => {
      const id = `sketches_text_${now}_${i}`;
      newSketches[id] = { id, type: 'text', text, fontSize, geometry: pts };
    });

    model.setState(state => ({
      ...state,
      elements: {
        ...state.elements,
        sketches: { ...state.elements.sketches, ...newSketches },
      },
    }));
    setContourCount(contours.length);
  }, [font, text, fontSize, model]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Text to Sketch</h3>

      {/* Font loading */}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Font URL (.ttf / .otf)</label>
          <input
            type="text"
            value={fontUrl}
            onChange={e => { setFontUrl(e.target.value); setFont(null); setContourCount(null); }}
            placeholder="https://..."
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-xs"
          />
        </div>
        <button
          onClick={handleLoadFont}
          disabled={loading || !fontUrl.trim()}
          className={`w-full py-2 rounded-md text-sm font-bold transition-colors
            ${loading || !fontUrl.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
        >
          {loading ? 'Loading…' : font ? 'Reload Font' : 'Load Font'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {font && <p className="text-xs text-green-600">Font loaded.</p>}
      </div>

      {/* Text parameters */}
      <div className="bg-white shadow-md rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Text</label>
          <input
            type="text"
            value={text}
            onChange={e => { setText(e.target.value); setContourCount(null); }}
            className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Font Size: {fontSize}</label>
          <input
            type="range" min={8} max={200} step={1} value={fontSize}
            onChange={e => { setFontSize(parseInt(e.target.value)); setContourCount(null); }}
            className="w-full mt-1"
          />
        </div>

        {font && (
          <button onClick={handlePreview}
            className="w-full py-1 rounded-md text-sm border border-gray-300 hover:bg-gray-50 transition-colors">
            Preview ({contourCount === null ? '?' : contourCount} contours)
          </button>
        )}
      </div>

      <button
        onClick={handleCreateSketches}
        disabled={!font || !text.trim()}
        className={`w-full font-bold py-2 px-4 rounded-md transition-colors
          ${font && text.trim()
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Create Sketches
      </button>

      {contourCount !== null && (
        <p className="text-xs text-gray-500 text-center">
          {contourCount} contour{contourCount !== 1 ? 's' : ''} added to sketches.
          Switch to Extrude View to extrude them.
        </p>
      )}
    </div>
  );
};
