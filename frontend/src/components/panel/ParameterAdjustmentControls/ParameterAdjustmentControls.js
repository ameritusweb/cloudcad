import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ParameterAdjustmentControls = ({ modelId, onModelUpdate }) => {
  const [parameters, setParameters] = useState({});

  useEffect(() => {
    // Fetch initial parameters
    fetchParameters();
  }, [modelId]);

  const fetchParameters = async () => {
    try {
      const response = await axios.get(`/api/get_parameters/${modelId}`);
      setParameters(response.data.parameters);
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  };

  const handleParameterChange = async (name, value) => {
    try {
      const response = await axios.post('/api/update_parameter', {
        modelId,
        parameterName: name,
        newValue: value
      });

      if (response.data.success) {
        onModelUpdate(response.data.updatedModel);
        setParameters(prevParams => ({ ...prevParams, [name]: value }));
      } else {
        console.error('Failed to update parameter:', response.data.error);
      }
    } catch (error) {
      console.error('Error updating parameter:', error);
    }
  };

  return (
    <div>
      <h3>Adjust Parameters</h3>
      {Object.entries(parameters).map(([name, value]) => (
        <div key={name}>
          <label>{name}: </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(name, parseFloat(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
};

export default ParameterAdjustmentControls;