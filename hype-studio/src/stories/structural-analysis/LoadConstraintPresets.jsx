import React from 'react';

const loadPresets = [
  { name: 'Uniform Load', loads: [{ magnitude: 1000, direction: { x: 0, y: -1, z: 0 }, temperature: 100 }] },
  { name: 'Point Load', loads: [{ magnitude: 5000, direction: { x: 0, y: -1, z: 0 }, temperature: 100 }] },
  // Add more presets as needed
];

const constraintPresets = [
  { name: 'Fixed Support', constraints: [{ type: 'fixed', temperature: 20 }] },
  { name: 'Pinned Support', constraints: [{ type: 'pinned', temperature: 20 }] },
  // Add more presets as needed
];

export const LoadConstraintPresets = ({ setLoads, setConstraints }) => {
  return (
    <div className="load-constraint-presets">
      <label>Load Presets:</label>
      <select onChange={(e) => {
        const preset = loadPresets.find(preset => preset.name === e.target.value);
        setLoads(preset.loads);
      }}>
        {loadPresets.map((preset) => (
          <option key={preset.name} value={preset.name}>{preset.name}</option>
        ))}
      </select>

      <label>Constraint Presets:</label>
      <select onChange={(e) => {
        const preset = constraintPresets.find(preset => preset.name === e.target.value);
        setConstraints(preset.constraints);
      }}>
        {constraintPresets.map((preset) => (
          <option key={preset.name} value={preset.name}>{preset.name}</option>
        ))}
      </select>
    </div>
  );
};