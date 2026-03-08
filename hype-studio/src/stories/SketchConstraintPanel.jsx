import React from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { getDegreesOfFreedom, CONSTRAINT_LABELS } from '../utils/sketchConstraintSolver';

// Which add-buttons apply to a single selected entity
const SINGLE_ENTITY = {
  circle:    ['fixed', 'dimension'],
  rectangle: ['horizontal', 'vertical', 'equal', 'fixed'],
  default:   ['fixed'],
};

// Which add-buttons apply when two entities are selected
const TWO_ENTITY = ['coincident', 'equal'];

const DOFBadge = ({ dof }) => {
  const color = dof === 0
    ? 'bg-green-100 text-green-700'
    : dof <= 2
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-500';
  const label = dof === 0 ? 'Fully Defined' : `${dof} DOF`;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
};

export const SketchConstraintPanel = ({ sketchId, sketch, secondarySketchId, secondarySketch }) => {
  const model = useHypeStudioModel();
  const allConstraints = useHypeStudioState('constraints', {});
  const currentConstraints = allConstraints[sketchId] ?? [];
  const dof = getDegreesOfFreedom(sketch.type, currentConstraints);

  const addConstraint = (type) => {
    model.setState(state => ({
      ...state,
      constraints: {
        ...state.constraints,
        [sketchId]: [...(state.constraints[sketchId] ?? []), { type }],
      },
    }));
  };

  const removeConstraint = (idx) => {
    model.setState(state => ({
      ...state,
      constraints: {
        ...state.constraints,
        [sketchId]: (state.constraints[sketchId] ?? []).filter((_, i) => i !== idx),
      },
    }));
  };

  const addTwoEntityConstraint = (type) => {
    if (!secondarySketchId) return;
    model.setState(state => ({
      ...state,
      constraints: {
        ...state.constraints,
        [sketchId]: [
          ...(state.constraints[sketchId] ?? []),
          { type, targetSketchId: secondarySketchId },
        ],
        [secondarySketchId]: [
          ...(state.constraints[secondarySketchId] ?? []),
          { type, targetSketchId: sketchId },
        ],
      },
    }));
  };

  const applicableAdd = SINGLE_ENTITY[sketch.type] ?? SINGLE_ENTITY.default;
  const existingTypes = new Set(currentConstraints.map(c => c.type));

  return (
    <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {sketch.type}
        </span>
        <DOFBadge dof={dof} />
      </div>

      {/* Existing constraints */}
      {currentConstraints.length > 0 && (
        <ul className="space-y-1">
          {currentConstraints.map((c, i) => {
            const info = CONSTRAINT_LABELS[c.type] ?? { symbol: '?', label: c.type };
            return (
              <li key={i} className="flex items-center justify-between text-xs bg-blue-50 rounded px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-blue-700 w-4 text-center">{info.symbol}</span>
                  <span className="text-gray-700">{info.label}</span>
                  {c.targetSketchId && (
                    <span className="text-gray-400 text-[10px]">→ {c.targetSketchId.slice(-6)}</span>
                  )}
                </span>
                <button
                  onClick={() => removeConstraint(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add single-entity constraints */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Add</p>
        <div className="flex flex-wrap gap-1">
          {applicableAdd.map(type => {
            const info = CONSTRAINT_LABELS[type];
            const already = existingTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => !already && addConstraint(type)}
                disabled={already}
                title={info.label}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  already
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-blue-300 bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                {info.symbol} {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-entity section */}
      {secondarySketchId && secondarySketch && (
        <div className="border-t border-gray-200 pt-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            With <span className="text-gray-600">{secondarySketch.type} …{secondarySketchId.slice(-6)}</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {TWO_ENTITY.map(type => {
              const info = CONSTRAINT_LABELS[type];
              return (
                <button
                  key={type}
                  onClick={() => addTwoEntityConstraint(type)}
                  title={info.label}
                  className="text-xs px-2 py-1 rounded border border-purple-300 bg-white text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  {info.symbol} {info.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
