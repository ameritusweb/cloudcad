import { Color3, Vector3 } from '@babylonjs/core';
import { getSketchEndpoints, getPlaneInfo } from './sketchSnapUtils';

export const CONSTRAINT_LABELS = {
  horizontal: { label: 'Horizontal', symbol: 'H'  },
  vertical:   { label: 'Vertical',   symbol: 'V'  },
  equal:      { label: 'Equal',      symbol: '='  },
  fixed:      { label: 'Fixed',      symbol: '\u22a3' },
  coincident: { label: 'Coincident', symbol: '\u25ce' },
  dimension:  { label: 'Dimension',  symbol: '\u2194' },
};

/**
 * Infer geometric constraints from a just-drawn sketch.
 * planeInfo is optional; if omitted, defaults to the Z (XY) plane.
 * Returns an array of constraint objects.
 */
export const inferConstraints = (sketchType, startPoint, endPoint, existingSketches, snapThreshold, planeInfo = null) => {
  const constraints = [];

  if (sketchType === 'circle') {
    return constraints;
  }

  if (sketchType === 'rectangle') {
    const pi = planeInfo || getPlaneInfo('Z');
    const startOff = startPoint.subtract(pi.origin);
    const endOff   = endPoint.subtract(pi.origin);
    const du = Math.abs(Vector3.Dot(endOff, pi.tangent1) - Vector3.Dot(startOff, pi.tangent1));
    const dv = Math.abs(Vector3.Dot(endOff, pi.tangent2) - Vector3.Dot(startOff, pi.tangent2));
    const dx = du;
    const dy = dv;

    if (dy < snapThreshold && dx > snapThreshold) {
      constraints.push({ type: 'horizontal' });
    }
    if (dx < snapThreshold && dy > snapThreshold) {
      constraints.push({ type: 'vertical' });
    }
    if (Math.abs(dx - dy) < snapThreshold) {
      constraints.push({ type: 'equal' });
    }
  }

  // Check for coincident with any existing endpoint
  const checkPoints = [startPoint, endPoint];
  checkPoints.forEach((pt, ptIdx) => {
    Object.entries(existingSketches).forEach(([sketchId, sketch]) => {
      getSketchEndpoints(sketch).forEach(ep => {
        if (Vector3.Distance(pt, ep) < snapThreshold) {
          constraints.push({
            type: 'coincident',
            pointIndex: ptIdx,
            targetSketchId: sketchId,
          });
        }
      });
    });
  });

  return constraints;
};

/**
 * Return a Babylon Color3 for a sketch based on its constraints.
 *
 * Blue  = under-constrained (default)
 * Black = fully constrained
 * Red   = over-constrained (future)
 */
export const getConstraintColor = (constraints) => {
  if (!constraints || constraints.length === 0) {
    return new Color3(0, 0, 1); // blue — under-constrained
  }

  const types = constraints.map(c => c.type);
  const hasDirection = types.includes('horizontal') || types.includes('vertical');
  const hasCoincident = types.includes('coincident');
  const hasDimension = types.includes('dimension');

  if (hasDimension && (hasDirection || hasCoincident)) {
    return new Color3(0.05, 0.05, 0.05); // nearly black — fully constrained
  }

  if (hasDirection && hasCoincident) {
    return new Color3(0.1, 0.1, 0.3); // dark blue — well constrained
  }

  if (hasDirection || hasCoincident || hasDimension) {
    return new Color3(0.2, 0.2, 0.6); // medium blue — partially constrained
  }

  return new Color3(0, 0, 1); // default blue
};

/**
 * Rough DOF estimate for a sketch type given its current constraints.
 */
export const getDegreesOfFreedom = (sketchType, constraints) => {
  const baseDOF = sketchType === 'circle' ? 3 : 5;
  const reduction = (constraints || []).reduce((acc, c) => {
    switch (c.type) {
      case 'horizontal':
      case 'vertical':   return acc + 1;
      case 'coincident': return acc + 2;
      case 'fixed':      return acc + 3;
      case 'dimension':  return acc + 1;
      default:           return acc;
    }
  }, 0);
  return Math.max(0, baseDOF - reduction);
};
