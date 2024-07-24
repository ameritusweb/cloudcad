import React, { useContext, useState } from 'react';
import axios from 'axios';
import { UserFeedbackContext } from '../../../contexts/UserFeedbackContext';

const EnhancedExportImportControls = ({ modelId, onModelImported }) => {
  const { showMessage, showError } = useContext(UserFeedbackContext);
  const [importDetails, setImportDetails] = useState(null);

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/export_model/${modelId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model_${modelId}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showMessage('Model exported successfully. You can now edit the JSON file if desired.');
    } catch (error) {
      showError('Error exporting model: ' + error.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post('/api/import_model', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (response.data.success) {
          onModelImported(response.data.modelId, response.data.modelData);
          showMessage('Model imported successfully');
          setImportDetails(response.data.modelData);
        } else {
          showError('Failed to import model: ' + response.data.error);
        }
      } catch (error) {
        showError('Error importing model: ' + error.message);
      }
    }
  };

  return (
    <div>
      <h3>Export/Import Model</h3>
      <button onClick={handleExport}>Export Model</button>
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
        id="import-file"
      />
      <label htmlFor="import-file">
        <button as="span">Import Model</button>
      </label>
      {importDetails && (
        <div>
          <h4>Import Details:</h4>
          <p>Number of features: {importDetails.features.length}</p>
          <p>Parameters: {JSON.stringify(importDetails.parameters)}</p>
          <p>Features:</p>
          <ul>
            {importDetails.features.map((feature, index) => (
              <li key={index}>
                Type: {feature.type}, Visible: {feature.visible.toString()}, 
                Color: {JSON.stringify(feature.color)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnhancedExportImportControls;