import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnhancedMirrorControls = ({ scene, onOperationComplete }) => {
  const [objectIds, setObjectIds] = useState([]);
  const [mirrorPlane, setMirrorPlane] = useState({ origin: [0, 0, 0], normal: [1, 0, 0] });
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [alignToAxis, setAlignToAxis] = useState(null);
  const [partialFeatures, setPartialFeatures] = useState({});

  useEffect(() => {
    // Populate objectIds with all available objects in the scene
    const availableObjects = scene.meshes.filter(mesh => !mesh.isGround).map(mesh => mesh.id);
    setObjectIds(availableObjects);
  }, [scene]);

  const handleMirror = async () => {
    try {
      const response = await axios.post('/api/mirror', {
        objectIds,
        mirrorPlane,
        keepOriginal,
        alignToAxis,
        partialFeatures
      });

      if (response.data.success) {
        onOperationComplete(response.data.updatedModel);
      } else {
        console.error('Failed to perform mirror operation:', response.data.error);
      }
    } catch (error) {
      console.error('Error performing mirror operation:', error);
    }
  };

  return (
    <div>
      <h3>Mirror Operation</h3>
      <div>
        <h4>Select Objects to Mirror</h4>
        {objectIds.map(id => (
          <label key={id}>
            <input
              type="checkbox"
              checked={objectIds.includes(id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setObjectIds([...objectIds, id]);
                } else {
                  setObjectIds(objectIds.filter(objId => objId !== id));
                }
              }}
            />
            {id}
          </label>
        ))}
      </div>
      <div>
        <h4>Mirror Plane</h4>
        <input
          type="text"
          placeholder="Origin (x,y,z)"
          value={mirrorPlane.origin.join(',')}
          onChange={(e) => setMirrorPlane({...mirrorPlane, origin: e.target.value.split(',').map(Number)})}
        />
        <input
          type="text"
          placeholder="Normal (x,y,z)"
          value={mirrorPlane.normal.join(',')}
          onChange={(e) => setMirrorPlane({...mirrorPlane, normal: e.target.value.split(',').map(Number)})}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={keepOriginal}
            onChange={(e) => setKeepOriginal(e.target.checked)}
          />
          Keep Original
        </label>
      </div>
      <div>
        <h4>Align to Axis</h4>
        <select value={alignToAxis || ''} onChange={(e) => setAlignToAxis(e.target.value || null)}>
          <option value="">None</option>
          <option value="x">X Axis</option>
          <option value="y">Y Axis</option>
          <option value="z">Z Axis</option>
        </select>
      </div>
      <button onClick={handleMirror}>Apply Mirror</button>
    </div>
  );
};

export default EnhancedMirrorControls;