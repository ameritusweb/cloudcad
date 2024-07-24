import React, { useState } from 'react';
import axios from 'axios';

const ParametricCircularCutControls = ({ modelId, onOperationComplete }) => {
  const [radius, setRadius] = useState(1);
  const [depth, setDepth] = useState(1);

  const handleCircularCut = async () => {
    try {
      const response = await axios.post('/api/add_feature', {
        modelId,
        featureType: 'circular_cut',
        parameters: {
          radius,
          depth
        }
      });

      if (response.data.success) {
        onOperationComplete(response.data.updatedModel);
      } else {
        console.error('Failed to perform circular cut:', response.data.error);
      }
    } catch (error) {
      console.error('Error performing circular cut:', error);
    }
  };

  return (
    <div>
      <h3>Circular Cut</h3>
      <input
        type="number"
        placeholder="Radius"
        value={radius}
        onChange={(e) => setRadius(parseFloat(e.target.value))}
      />
      <input
        type="number"
        placeholder="Depth"
        value={depth}
        onChange={(e) => setDepth(parseFloat(e.target.value))}
      />
      <button onClick={handleCircularCut}>Apply Circular Cut</button>
    </div>
  );
};

export default ParametricCircularCutControls;