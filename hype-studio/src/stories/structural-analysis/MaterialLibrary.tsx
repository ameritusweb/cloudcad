import React from 'react';

const materials = [
  { 
    name: 'Steel', 
    youngsModulus: 200e9, 
    poissonRatio: 0.3, 
    yieldStrength: 250e6, 
    fatigueStrength: 200e6, 
    fatigueExponent: 10, 
    thermalExpansionCoeff: 12e-6, 
    density: 7850,
    thermalConductivity: 45, // W/mK
    specificHeat: 500, // J/kgK
  },
  { 
    name: 'Aluminum', 
    youngsModulus: 70e9, 
    poissonRatio: 0.33, 
    yieldStrength: 300e6, 
    fatigueStrength: 120e6, 
    fatigueExponent: 8, 
    thermalExpansionCoeff: 23e-6, 
    density: 2700,
    thermalConductivity: 237, // W/mK
    specificHeat: 897, // J/kgK
  },
  // Add more materials as needed
];

export const MaterialLibrary = ({ selectedMaterial, setSelectedMaterial }) => {
  return (
    <div className="material-library">
      <label>Material:</label>
      <select value={selectedMaterial.name} onChange={(e) => {
        const material = materials.find(mat => mat.name === e.target.value);
        setSelectedMaterial(material);
      }}>
        {materials.map((material) => (
          <option key={material.name} value={material.name}>{material.name}</option>
        ))}
      </select>
    </div>
  );
};