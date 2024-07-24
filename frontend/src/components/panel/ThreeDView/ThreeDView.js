import React, { useRef, useEffect, useState } from 'react';
import BabylonSceneService from '../../../services/babylonScene';

const ThreeDView = ({ modelData, analysisResults, failurePoints }) => {
  const canvasRef = useRef(null);
  const [sceneService, setSceneService] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      const service = new BabylonSceneService(canvasRef.current);
      setSceneService(service);

      return () => service.dispose();
    }
  }, []);

  useEffect(() => {
    if (sceneService && modelData) {
      sceneService.updateScene(modelData, analysisResults, failurePoints);
    }
  }, [sceneService, modelData, analysisResults, failurePoints]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeDView;