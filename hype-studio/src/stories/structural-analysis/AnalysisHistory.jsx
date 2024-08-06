import React, { useState } from 'react';

export const AnalysisHistory = ({ analysisHistory, setAnalysisHistory, setCurrentResults }) => {
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

  const handleViewHistory = (index) => {
    setCurrentResults(analysisHistory[index]);
    setSelectedHistoryIndex(index);
  };

  return (
    <div className="analysis-history">
      <h3>Analysis History</h3>
      <ul>
        {analysisHistory.map((result, index) => (
          <li key={index}>
            <button onClick={() => handleViewHistory(index)}>
              Analysis {index + 1} - {result.analysisType}
            </button>
          </li>
        ))}
      </ul>
      {selectedHistoryIndex !== null && (
        <div>
          <h4>Selected Analysis: {selectedHistoryIndex + 1}</h4>
          {/* Display details of the selected analysis result */}
        </div>
      )}
    </div>
  );
};