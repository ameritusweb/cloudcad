import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserFeedbackContext } from '../../../contexts/UserFeedbackContext';

const StructuralAnalysisControls = ({ modelId, onAnalysisComplete }) => {
  const [materialProperties, setMaterialProperties] = useState({
    young_modulus: 200000,  // Default value for steel (MPa)
    poisson_ratio: 0.3,
    yield_strength: 250  // Default value for mild steel (MPa)
  });
  const [loads, setLoads] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const { showMessage, showError } = useContext(UserFeedbackContext);

  const handleMaterialChange = (e) => {
    setMaterialProperties({
      ...materialProperties,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  const handleAddLoad = () => {
    setLoads([...loads, { node: '', direction: '', magnitude: '' }]);
  };

  const handleLoadChange = (index, field, value) => {
    const newLoads = [...loads];
    newLoads[index][field] = value;
    setLoads(newLoads);
  };

  const handleRemoveLoad = (index) => {
    const newLoads = loads.filter((_, i) => i !== index);
    setLoads(newLoads);
  };

  const handleAddConstraint = () => {
    setConstraints([...constraints, { node: '', dof: '', value: '' }]);
  };

  const handleConstraintChange = (index, field, value) => {
    const newConstraints = [...constraints];
    newConstraints[index][field] = value;
    setConstraints(newConstraints);
  };

  const handleRemoveConstraint = (index) => {
    const newConstraints = constraints.filter((_, i) => i !== index);
    setConstraints(newConstraints);
  };

  const handleAnalysis = async () => {
    try {
      const response = await axios.post('/api/structural_analysis/analyze', {
        modelId,
        materialProperties,
        loads,
        constraints
      });

      if (response.data.success) {
        onAnalysisComplete(response.data.results, response.data.failurePoints);
        showMessage('Structural analysis completed successfully');
      } else {
        showError('Failed to perform structural analysis: ' + response.data.error);
      }
    } catch (error) {
      showError('Error performing structural analysis: ' + error.message);
    }
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Structural Analysis</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Material Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">
              <span className="label-text">Young's Modulus (MPa)</span>
            </label>
            <input
              type="number"
              name="young_modulus"
              value={materialProperties.young_modulus}
              onChange={handleMaterialChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Poisson's Ratio</span>
            </label>
            <input
              type="number"
              name="poisson_ratio"
              value={materialProperties.poisson_ratio}
              onChange={handleMaterialChange}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Yield Strength (MPa)</span>
            </label>
            <input
              type="number"
              name="yield_strength"
              value={materialProperties.yield_strength}
              onChange={handleMaterialChange}
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Loads</h3>
        {loads.map((load, index) => (
          <div key={index} className="flex flex-wrap items-end mb-2">
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">Node</span>
              </label>
              <input
                type="text"
                value={load.node}
                onChange={(e) => handleLoadChange(index, 'node', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">Direction</span>
              </label>
              <input
                type="text"
                value={load.direction}
                onChange={(e) => handleLoadChange(index, 'direction', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">Magnitude</span>
              </label>
              <input
                type="number"
                value={load.magnitude}
                onChange={(e) => handleLoadChange(index, 'magnitude', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <button onClick={() => handleRemoveLoad(index)} className="btn btn-error btn-sm">
              Remove
            </button>
          </div>
        ))}
        <button onClick={handleAddLoad} className="btn btn-primary btn-sm">
          Add Load
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Constraints</h3>
        {constraints.map((constraint, index) => (
          <div key={index} className="flex flex-wrap items-end mb-2">
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">Node</span>
              </label>
              <input
                type="text"
                value={constraint.node}
                onChange={(e) => handleConstraintChange(index, 'node', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">DOF</span>
              </label>
              <input
                type="text"
                value={constraint.dof}
                onChange={(e) => handleConstraintChange(index, 'dof', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="mr-2 mb-2">
              <label className="label">
                <span className="label-text">Value</span>
              </label>
              <input
                type="number"
                value={constraint.value}
                onChange={(e) => handleConstraintChange(index, 'value', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <button onClick={() => handleRemoveConstraint(index)} className="btn btn-error btn-sm">
              Remove
            </button>
          </div>
        ))}
        <button onClick={handleAddConstraint} className="btn btn-primary btn-sm">
          Add Constraint
        </button>
      </div>

      <div className="mt-4">
        <button onClick={handleAnalysis} className="btn btn-primary w-full">
          Run Structural Analysis
        </button>
      </div>
    </div>
  );
};

export default StructuralAnalysisControls;