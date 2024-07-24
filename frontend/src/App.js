import React, { useState, useEffect } from 'react';
import { UserFeedbackProvider } from './contexts/UserFeedbackContext';
import AdvancedCADControlPanel from './components/AdvancedCadControlPanel/AdvancedCadControlPanel';
import ThreeDView from './components/ThreeDView/ThreeDView';
import StructuralAnalysisControls from './components/StructuralAnalysisControls/StructuralAnalysisControls';
import ParameterAdjustmentControls from './components/ParameterAdjustmentControls/ParameterAdjustmentControls';
import FailurePointsDisplay from './components/FailurePointsDisplay/FailurePointsDisplay';
import ExportImportControls from './components/ExportImportControls/ExportImportControls';

function App() {
  const [currentModelId, setCurrentModelId] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [failurePoints, setFailurePoints] = useState(null);

  // ... (rest of the state management and useEffect remain the same)

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