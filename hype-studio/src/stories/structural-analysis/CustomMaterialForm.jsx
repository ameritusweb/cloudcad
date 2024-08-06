import React, { useState } from 'react';

export const CustomMaterialForm = ({ material, onSave }) => {
  const [customMaterial, setCustomMaterial] = useState(material);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomMaterial({ ...customMaterial, [name]: value });
  };

  const handleSave = () => {
    onSave(customMaterial);
  };

  return (
    <div className="custom-material-form">
      <h3>Customize Material</h3>
      <label>
        Name:
        <input type="text" name="name" value={customMaterial.name} onChange={handleChange} />
      </label>
      <label>
        Young's Modulus (Pa):
        <input type="number" name="youngsModulus" value={customMaterial.youngsModulus} onChange={handleChange} />
      </label>
      <label>
        Poisson's Ratio:
        <input type="number" name="poissonRatio" value={customMaterial.poissonRatio} onChange={handleChange} />
      </label>
      <label>
        Yield Strength (Pa):
        <input type="number" name="yieldStrength" value={customMaterial.yieldStrength} onChange={handleChange} />
      </label>
      <label>
        Fatigue Strength (Pa):
        <input type="number" name="fatigueStrength" value={customMaterial.fatigueStrength} onChange={handleChange} />
      </label>
      <label>
        Fatigue Exponent:
        <input type="number" name="fatigueExponent" value={customMaterial.fatigueExponent} onChange={handleChange} />
      </label>
      <label>
        Thermal Expansion Coefficient (1/K):
        <input type="number" name="thermalExpansionCoeff" value={customMaterial.thermalExpansionCoeff} onChange={handleChange} />
      </label>
      <label>
        Density (kg/m³):
        <input type="number" name="density" value={customMaterial.density} onChange={handleChange} />
      </label>
      <label>
        Thermal Conductivity (W/mK):
        <input type="number" name="thermalConductivity" value={customMaterial.thermalConductivity} onChange={handleChange} />
      </label>
      <label>
        Specific Heat (J/kgK):
        <input type="number" name="specificHeat" value={customMaterial.specificHeat} onChange={handleChange} />
      </label>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};