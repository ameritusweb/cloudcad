import React, { useState } from 'react';
import axios from 'axios';

const ParametricConcentricExtrudeControls = ({ modelId, onOperationComplete }) => {
  const [outerRadius, setOuterRadius] = useState(5);
  const [innerRadius, setInnerRadius] = useState(3);
  const [height, setHeight] = useState(1);

  const handleConcentricExtrude = async () => {
    try {
      const response = await axios.post('/api/add_feature', {
        modelId,
        featureType: 'concentric_extrude',
        parameters: {
          outerRadius,
          innerRadius,
          height
        }
      });

      if (response.data.success) {
        onOperationComplete(response.data.updatedModel);
      } else {
        console.error('Failed to perform concentric extrude:', response.data.error);
      }
    } catch (error) {
      console.error('Error performing concentric extrude:', error);
    }
  };

  return (
    <div>
      <h3>Concentric Extrude</h3>
      <input
        type="number"
        placeholder="Outer Radius"
        value={outerRadius}
        onChange={(e) => setOuterRadius(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Inner Radius"
        value={innerRadius}
        onChange={(e) => setInnerRadius(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Height"
        value={height}
        onChange={(e) => setHeight(parseFloat(e.target.value))}
      />
      <button onClick={handleConcentricExtrude}>Apply Concentric Extrude</button>
    </div>
  );
};

export default ParametricConcentricExtrudeControls;