import React, { useState, useEffect } from 'react';
import { UserFeedbackProvider } from './contexts/UserFeedbackContext';
import AdvancedCADControlPanel from './components/panel/AdvancedCadControlPanel/AdvancedCadControlPanel';
import ThreeDView from './components/panel/ThreeDView/ThreeDView';
import StructuralAnalysisControls from './components/panel/StructuralAnalysisControls/StructuralAnalysisControls';
import ParameterAdjustmentControls from './components/panel/ParameterAdjustmentControls/ParameterAdjustmentControls';
import FailurePointsDisplay from './components/panel/FailurePointsDisplay/FailurePointsDisplay';
import ExportImportControls from './components/panel/EnhancedExportImportControls/EnhancedExportImportControls';

function App() {
  const [currentModelId, setCurrentModelId] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [failurePoints, setFailurePoints] = useState(null);

  useEffect(() => {
    // Fetch initial model data when the app loads
    // This is a placeholder and should be replaced with actual API call
    const fetchInitialModel = async () => {
      // const response = await fetch('/api/initial-model');
      // const data = await response.json();
      // setCurrentModelId(data.modelId);
      // setModelData(data.modelData);
    };
    fetchInitialModel();
  }, []);

  const handleModelUpdate = (updatedModelData) => {
    setModelData(updatedModelData);
  };

  const handleAnalysisComplete = (results, failures) => {
    setAnalysisResults(results);
    setFailurePoints(failures);
  };

  const handleModelImport = (modelId, importedModelData) => {
    setCurrentModelId(modelId);
    setModelData(importedModelData);
    setAnalysisResults(null);
    setFailurePoints(null);
  };

  /*
                <AdvancedCADControlPanel
                  currentModelId={currentModelId}
                  onModelUpdate={handleModelUpdate}
                />
                <ParameterAdjustmentControls
                  modelId={currentModelId}
                  onModelUpdate={handleModelUpdate}
                />
                <StructuralAnalysisControls
                  modelId={currentModelId}
                  onAnalysisComplete={handleAnalysisComplete}
                />
                <ExportImportControls
                  modelId={currentModelId}
                  onModelImported={handleModelImport}
                />
  */

  return (
    <UserFeedbackProvider>
      <div className="min-h-screen bg-base-100 text-base-content">
        <header className="navbar bg-primary text-primary-content">
          <div className="flex-1">
            <span className="text-lg font-bold">CloudCad</span>
          </div>
        </header>
        <main className="container mx-auto p-4 flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 pr-4">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
              <AdvancedCADControlPanel
                  currentModelId={currentModelId}
                  onModelUpdate={handleModelUpdate}
                />
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 mt-4 md:mt-0">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <ThreeDView
                  modelData={modelData}
                  analysisResults={analysisResults}
                  failurePoints={failurePoints}
                />
              </div>
            </div>
            {failurePoints && (
              <div className="mt-4 card bg-base-200 shadow-xl">
                <div className="card-body">
                  <FailurePointsDisplay failurePoints={failurePoints} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </UserFeedbackProvider>
  );
}

export default App;