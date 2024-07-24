import React, { useState, useContext } from 'react';
import { UserFeedbackContext } from '../../../contexts/UserFeedbackContext';
import CircularCutControls from '../ParametricCircularCutControls/ParametricCircularCutControls';
import ConcentricExtrudeControls from '../ParametricConcentricExtrudeControls/ParametricConcentricExtrudeControls';
import EnhancedMirrorControls from '../EnhancedMirrorControls/EnhancedMirrorControls';
import ParameterAdjustmentControls from '../ParameterAdjustmentControls/ParameterAdjustmentControls';
import StructuralAnalysisControls from '../StructuralAnalysisControls/StructuralAnalysisControls';
import ExportImportControls from '../EnhancedExportImportControls/EnhancedExportImportControls';
import ApiService from '../../../services/ApiService';

const AdvancedCadControlPanel = ({ currentModelId, onModelUpdate }) => {
  const [currentOperation, setCurrentOperation] = useState(null);
  const { showMessage, showError } = useContext(UserFeedbackContext);

  const handleNewModel = async () => {
    try {
      const response = await ApiService.createModel();
      const data = await response.json();
      if (data.success) {
        onModelUpdate(data.modelId, data.modelData);
        showMessage('New model created');
      } else {
        showError('Failed to create new model');
      }
    } catch (error) {
      showError('Error creating new model');
    }
  };

  const handleOperationComplete = (updatedModelData) => {
    onModelUpdate(currentModelId, updatedModelData);
    showMessage('Operation completed successfully');
    setCurrentOperation(null);
  };

  const handleAnalysisComplete = (results, failures) => {
    // This function would be passed down to StructuralAnalysisControls
    // and then up to the parent component to update the 3D view
    onModelUpdate(currentModelId, null, results, failures);
    showMessage('Structural analysis completed successfully');
  };

  const handleModelImport = (modelId, importedModelData) => {
    onModelUpdate(modelId, importedModelData);
    showMessage('Model imported successfully');
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">CAD Control Panel</h2>
      
      <div className="mb-4">
        <button onClick={handleNewModel} className="btn btn-primary w-full">
          Create New Model
        </button>
      </div>

      {currentModelId && (
        <>
          <div className="mb-4">
            <select 
              onChange={(e) => setCurrentOperation(e.target.value)} 
              className="select select-bordered w-full"
            >
              <option value="">Select Operation</option>
              <option value="circularCut">Circular Cut</option>
              <option value="concentricExtrude">Concentric Circles Extrude</option>
              <option value="mirror">Mirror</option>
              <option value="parameterAdjustment">Adjust Parameters</option>
              <option value="structuralAnalysis">Structural Analysis</option>
            </select>
          </div>

          {currentOperation === 'circularCut' && (
            <CircularCutControls
              modelId={currentModelId}
              onOperationComplete={handleOperationComplete}
            />
          )}

          {currentOperation === 'concentricExtrude' && (
            <ConcentricExtrudeControls
              modelId={currentModelId}
              onOperationComplete={handleOperationComplete}
            />
          )}

          {currentOperation === 'mirror' && (
            <EnhancedMirrorControls
              modelId={currentModelId}
              onOperationComplete={handleOperationComplete}
            />
          )}

          {currentOperation === 'parameterAdjustment' && (
            <ParameterAdjustmentControls
              modelId={currentModelId}
              onModelUpdate={handleOperationComplete}
            />
          )}

          {currentOperation === 'structuralAnalysis' && (
            <StructuralAnalysisControls
              modelId={currentModelId}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          <div className="mt-4">
            <ExportImportControls
              modelId={currentModelId}
              onModelImported={handleModelImport}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedCadControlPanel;