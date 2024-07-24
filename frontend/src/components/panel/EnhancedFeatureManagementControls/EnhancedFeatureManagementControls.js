import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserFeedbackContext } from './UserFeedbackUtility';

const EnhancedFeatureManagementControls = ({ modelId, onModelUpdate }) => {
  const [features, setFeatures] = useState([]);
  const { showMessage, showError } = useContext(UserFeedbackContext);

  useEffect(() => {
    fetchFeatures();
  }, [modelId]);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get(`/api/get_features/${modelId}`);
      setFeatures(response.data.features);
    } catch (error) {
      showError('Error fetching features: ' + error.message);
    }
  };

  const handleVisibilityChange = async (featureId, visible) => {
    try {
      const response = await axios.post('/api/set_feature_visibility', {
        modelId,
        featureId,
        visible
      });

      if (response.data.success) {
        onModelUpdate(response.data.updatedModel);
        setFeatures(response.data.updatedModel.features);
        showMessage(`Feature ${featureId} visibility updated`);
      } else {
        showError('Failed to update feature visibility: ' + response.data.error);
      }
    } catch (error) {
      showError('Error updating feature visibility: ' + error.message);
    }
  };

  const handleColorChange = async (featureId, color) => {
    try {
      const response = await axios.post('/api/set_feature_color', {
        modelId,
        featureId,
        color
      });

      if (response.data.success) {
        onModelUpdate(response.data.updatedModel);
        setFeatures(response.data.updatedModel.features);
        showMessage(`Feature ${featureId} color updated`);
      } else {
        showError('Failed to update feature color: ' + response.data.error);
      }
    } catch (error) {
      showError('Error updating feature color: ' + error.message);
    }
  };

  return (
    <div>
      <h3>Feature Management</h3>
      {features.map(feature => (
        <div key={feature.id}>
          <label>
            <input
              type="checkbox"
              checked={feature.visible}
              onChange={(e) => handleVisibilityChange(feature.id, e.target.checked)}
            />
            Feature {feature.id}
          </label>
          <input
            type="color"
            value={`#${feature.color.map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`}
            onChange={(e) => handleColorChange(feature.id, e.target.value.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16) / 255))}
          />
        </div>
      ))}
    </div>
  );
};

export default EnhancedFeatureManagementControls;