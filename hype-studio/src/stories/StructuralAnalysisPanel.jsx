import React, { memo, useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { MaterialLibrary } from './MaterialLibrary';
import { CustomMaterialForm } from './CustomMaterialForm';
import { LoadConstraintPresets } from './LoadConstraintPresets';
import { AnalysisHistory } from './AnalysisHistory';

export const StructuralAnalysisPanel = memo(() => {
    const model = useHypeStudioModel();
    const [analysisType, setAnalysisType] = useState('static');
    const [material, setMaterial] = useState({
      name: 'Steel',
      youngsModulus: 200e9,
      poissonRatio: 0.3,
      yieldStrength: 250e6,
      fatigueStrength: 200e6,
      fatigueExponent: 10,
      thermalExpansionCoeff: 12e-6,
      density: 7850,
    });
    const [geometry, setGeometry] = useState({
      length: 1,
      width: 0.1,
      height: 0.1,
      nodes: Array.from({length: 100}, (_, i) => ({ id: i })),
    });
    const [loads, setLoads] = useState([{ magnitude: 1000, direction: { x: 0, y: -1, z: 0 }, temperature: 100 }]);
    const [constraints, setConstraints] = useState([{ type: 'fixed', temperature: 20 }]);
    const [results, setResults] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [customMaterials, setCustomMaterials] = useState([]);
  
    const runAnalysis = async () => {
      try {
        const response = await fetch('/api/structural-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisType, material, geometry, loads, constraints }),
        });
        const data = await response.json();
        setResults(data);
        model.setAnalysisResults(data);
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    };

    const saveCustomMaterial = (customMaterial) => {
        setCustomMaterials([...customMaterials, customMaterial]);
        setMaterial(customMaterial);
      };
    
  
    return (
      <div className="structural-analysis-panel">
        <h2>Structural Analysis</h2>
        
        <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
          <option value="static">Static Analysis</option>
          <option value="fatigue">Fatigue Analysis</option>
          <option value="thermal">Thermal Analysis</option>
          <option value="dynamic">Dynamic Analysis</option>
        </select>
  
        <MaterialLibrary selectedMaterial={material} setSelectedMaterial={setMaterial} />
        <LoadConstraintPresets setLoads={setLoads} setConstraints={setConstraints} />

        <CustomMaterialForm material={material} onSave={saveCustomMaterial} />
  
        <button onClick={runAnalysis}>Run Analysis</button>
  
        {results && (
          <div className="analysis-results">
            <h3>Analysis Results</h3>
            {analysisType === 'static' && (
              <>
                <p>Max Stress: {results.maxStress.toFixed(2)} Pa</p>
                <p>Max Displacement: {results.maxDisplacement.toFixed(6)} m</p>
                <p>Factor of Safety: {results.factorOfSafety.toFixed(2)}</p>
              </>
            )}
            {analysisType === 'fatigue' && (
              <>
                <p>Cycles to Failure: {results.cyclestoFailure.toExponential(2)}</p>
                <p>Damage per Cycle: {results.damagePerCycle.toExponential(2)}</p>
              </>
            )}
            {analysisType === 'thermal' && (
              <>
                <p>Max Temperature: {results.maxTemperature.toFixed(2)} °C</p>
                <p>Thermal Stress: {results.thermalStress.toFixed(2)} Pa</p>
                <p>Thermal Displacement: {results.thermalDisplacement.toFixed(6)} m</p>
              </>
            )}
            {analysisType === 'dynamic' && (
              <>
                <p>Natural Frequency: {results.naturalFrequency.toFixed(2)} Hz</p>
                <p>Max Dynamic Displacement: {Math.max(...results.dynamicResults.map(r => Math.abs(r.displacement))).toFixed(6)} m</p>
              </>
            )}
          </div>
        )}

        <AnalysisHistory analysisHistory={analysisHistory} setAnalysisHistory={setAnalysisHistory} setCurrentResults={setResults} />
      </div>
    );
  });