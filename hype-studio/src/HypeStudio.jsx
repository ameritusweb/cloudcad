import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Engine } from '@babylonjs/core';
import { Header } from './stories/Header';
import { Toolbar } from './stories/Toolbar';
import { LeftPanel } from './stories/LeftPanel';
import { BabylonViewport } from './stories/BabylonViewport';
import { PropertyPanel } from './stories/PropertyPanel';
import { BabylonControls } from './stories/BabylonControls';
import { useHypeStudioModel } from './contexts/HypeStudioContext';

const HypeStudio = React.memo(() => {
  const model = useHypeStudioModel();
  const [engine, setEngine] = useState(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !engine) {
      const newEngine = new Engine(canvasRef.current, true);
      setEngine(newEngine);

      window.addEventListener('resize', () => newEngine.resize());

      return () => {
        window.removeEventListener('resize', () => newEngine.resize());
        newEngine.dispose();
      };
    }
  }, [engine]);

  const handleSketchCreate = useCallback((type, sketchData) => {
    const newSketch = { type, ...sketchData };
    const sketchId = model.createSketch(newSketch);
    console.log(`Created new sketch with ID: ${sketchId}`);
    model.updateListViewContent();
  }, [model]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-100">
      <Header />
      <Toolbar />
      <div className="flex flex-1">
        <LeftPanel />
        <div className="flex-1 relative">
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          {engine && (
            <BabylonViewport 
              ref={viewportRef}
              engine={engine}
              canvas={canvasRef.current}
              onSketchCreate={handleSketchCreate}
            />
          )}
          <BabylonControls />
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
});

export default HypeStudio;