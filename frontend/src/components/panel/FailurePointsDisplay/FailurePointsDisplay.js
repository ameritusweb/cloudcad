import React from 'react';

const FailurePointsDisplay = ({ failurePoints }) => {
  const getSeverityColor = (severity) => {
    // Convert severity (0-1) to a color scale (green to red)
    const r = Math.round(severity * 255);
    const g = Math.round((1 - severity) * 255);
    return `rgb(${r}, ${g}, 0)`;
  };

  return (
    <div>
      <h3>Potential Failure Points</h3>
      {failurePoints.map((point, index) => (
        <div key={index} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h4 style={{ color: getSeverityColor(point.severity) }}>
            Point {index + 1} (Severity: {(point.severity * 100).toFixed(2)}%)
          </h4>
          <p>Node: {point.node}</p>
          <p>Position: ({point.position.x.toFixed(2)}, {point.position.y.toFixed(2)}, {point.position.z.toFixed(2)})</p>
          <p>Stress: {point.stress.toFixed(2)} MPa</p>
          <p>Safety Factor: {point.safety_factor.toFixed(2)}</p>
          <p>Explanation: This point has a safety factor of {point.safety_factor.toFixed(2)}, 
             which is below the recommended minimum of 2.0. The stress at this point is 
             {point.stress.toFixed(2)} MPa, which is {((point.stress / point.safety_factor) * 100).toFixed(2)}% 
             of the material's yield strength.</p>
          <h5>Recommendations:</h5>
          <ul>
            {point.recommendations.map((rec, recIndex) => (
              <li key={recIndex}>{rec}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FailurePointsDisplay;