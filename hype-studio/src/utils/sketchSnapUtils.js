import { Vector3 } from '@babylonjs/core';

/**
 * Build a PlaneInfo descriptor from a plane ID (standard) or arbitrary normal (custom).
 * Returns { normal, tangent1, tangent2, origin }.
 *
 * tangent1 and tangent2 span the plane surface; all are unit vectors.
 */
export const getPlaneInfo = (planeId, customNormal = null) => {
  let normal;

  if (customNormal) {
    normal = customNormal.normalize();
  } else {
    switch (planeId) {
      case 'X': normal = new Vector3(1, 0, 0); break;
      case 'Y': normal = new Vector3(0, 1, 0); break;
      default:  normal = new Vector3(0, 0, 1); break; // 'Z' or fallback
    }
  }

  // Pick a reference "up" that is not parallel to normal
  const ref = Math.abs(Vector3.Dot(normal, Vector3.Up())) > 0.99
    ? new Vector3(1, 0, 0)
    : Vector3.Up();

  const tangent1 = Vector3.Cross(ref, normal).normalize();
  const tangent2 = Vector3.Cross(normal, tangent1).normalize();

  return { normal, tangent1, tangent2, origin: Vector3.Zero() };
};

/**
 * Snap a world-space point to the nearest grid intersection on the given plane.
 * The point is projected into tangent space, rounded, then reconstructed.
 */
export const snapToGrid = (point, gridSize, planeInfo) => {
  if (!gridSize || gridSize <= 0) return point.clone();
  const { tangent1, tangent2, normal, origin } = planeInfo;

  const offset = point.subtract(origin);
  const u = Math.round(Vector3.Dot(offset, tangent1) / gridSize) * gridSize;
  const v = Math.round(Vector3.Dot(offset, tangent2) / gridSize) * gridSize;
  // Preserve the normal component so the point stays on the plane
  const n = Vector3.Dot(offset, normal);

  return origin
    .add(tangent1.scale(u))
    .add(tangent2.scale(v))
    .add(normal.scale(n));
};

/**
 * Returns an array of Vector3 snap candidates for a sketch (world-space).
 */
export const getSketchEndpoints = (sketch) => {
  const pts = [];
  if (!sketch) return pts;

  switch (sketch.type) {
    case 'circle':
      if (sketch.center) {
        pts.push(new Vector3(sketch.center.x, sketch.center.y, sketch.center.z ?? 0));
      }
      break;
    case 'rectangle': {
      const cx = sketch.center?.x ?? 0;
      const cy = sketch.center?.y ?? 0;
      const cz = sketch.center?.z ?? 0;
      const hw = (sketch.width ?? 0) / 2;
      const hh = (sketch.height ?? 0) / 2;
      pts.push(
        new Vector3(cx - hw, cy - hh, cz),
        new Vector3(cx + hw, cy - hh, cz),
        new Vector3(cx + hw, cy + hh, cz),
        new Vector3(cx - hw, cy + hh, cz),
        new Vector3(cx, cy, cz)
      );
      break;
    }
    default:
      if (Array.isArray(sketch.geometry)) {
        sketch.geometry.forEach(p => pts.push(new Vector3(p.x, p.y, p.z ?? 0)));
      }
      break;
  }
  return pts;
};

/**
 * Find the nearest existing sketch endpoint within `threshold` world units.
 * Returns a snap Vector3 or null.
 */
export const findNearestEndpoint = (cursorPoint, sketches, threshold) => {
  let nearest = null;
  let nearestDist = threshold;

  Object.values(sketches).forEach(sketch => {
    getSketchEndpoints(sketch).forEach(pt => {
      const dist = Vector3.Distance(cursorPoint, pt);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = pt;
      }
    });
  });

  return nearest;
};

/**
 * Compute inference (alignment) lines from the cursor to matching sketch endpoints,
 * working in the tangent space of the given plane.
 *
 * Returns [{ from: Vector3, to: Vector3, axis: 'h'|'v' }]
 */
export const computeInferenceLines = (cursorPoint, sketches, threshold, planeInfo) => {
  const { tangent1, tangent2, normal, origin } = planeInfo;
  const EXTEND = 20;
  const lines = [];

  const toUV = (pt) => {
    const off = pt.subtract(origin);
    return { u: Vector3.Dot(off, tangent1), v: Vector3.Dot(off, tangent2) };
  };

  const cursorUV = toUV(cursorPoint);

  Object.values(sketches).forEach(sketch => {
    getSketchEndpoints(sketch).forEach(pt => {
      const ptUV = toUV(pt);
      const du = Math.abs(cursorUV.u - ptUV.u);
      const dv = Math.abs(cursorUV.v - ptUV.v);

      // Tangent1-alignment ("vertical" in plane): cursor u ≈ point u
      if (du < threshold && dv > threshold * 2) {
        const vMin = Math.min(cursorUV.v, ptUV.v) - EXTEND * 0.05;
        const vMax = Math.max(cursorUV.v, ptUV.v) + EXTEND * 0.05;
        lines.push({
          from: origin.add(tangent1.scale(ptUV.u)).add(tangent2.scale(vMin)).add(normal.scale(0.002)),
          to:   origin.add(tangent1.scale(ptUV.u)).add(tangent2.scale(vMax)).add(normal.scale(0.002)),
          axis: 'v',
        });
      }

      // Tangent2-alignment ("horizontal" in plane): cursor v ≈ point v
      if (dv < threshold && du > threshold * 2) {
        const uMin = Math.min(cursorUV.u, ptUV.u) - EXTEND * 0.05;
        const uMax = Math.max(cursorUV.u, ptUV.u) + EXTEND * 0.05;
        lines.push({
          from: origin.add(tangent2.scale(ptUV.v)).add(tangent1.scale(uMin)).add(normal.scale(0.002)),
          to:   origin.add(tangent2.scale(ptUV.v)).add(tangent1.scale(uMax)).add(normal.scale(0.002)),
          axis: 'h',
        });
      }
    });
  });

  return lines;
};

/**
 * Apply all snapping to a raw world-space point on the given plane.
 * Returns { snappedPoint: Vector3, snappedToEndpoint: boolean }
 */
export const applySnap = (rawPoint, sketches, snapSettings, planeInfo) => {
  const { gridEnabled, gridSize, snapToEndpoints, snapThreshold } = snapSettings;

  let snappedPoint = gridEnabled
    ? snapToGrid(rawPoint, gridSize, planeInfo)
    : rawPoint.clone();

  let snappedToEndpoint = false;
  if (snapToEndpoints) {
    const ep = findNearestEndpoint(rawPoint, sketches, snapThreshold);
    if (ep) {
      snappedPoint = ep.clone();
      snappedToEndpoint = true;
    }
  }

  return { snappedPoint, snappedToEndpoint };
};
