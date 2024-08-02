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

  useEffect(() => {
    if (canvasRef.current) {
      const newEngine = new Engine(canvasRef.current, true);
      setEngine(newEngine);
      newEngine.isEngineActive = true;

      window.addEventListener('resize', () => newEngine.resize());

      return () => {
        window.removeEventListener('resize', () => newEngine.resize());
        newEngine.isEngineActive = false;
        newEngine.dispose();
        setEngine(null);
      };
    }
  }, []);

  const handleSketchCreate = useCallback((type, sketchData) => {
    const newSketch = { type, ...sketchData };
    const sketchId = model.createSketch(newSketch);
    console.log(`Created new sketch with ID: ${sketchId}`);
    model.updateListViewContent();
  }, [model]);

  return (
    <div className="h-full w-full" style={{ minWidth: '1150px' }}>
      <Header />
      <Toolbar />
      <div className="flex flex-1">
        <LeftPanel />
        <div className="flex-1 relative pb-[48px]">
          <canvas className="border-2 border-gray-300 outline-none" ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          {engine && (<BabylonViewport engine={engine} canvas={canvasRef.current} />)}
          <BabylonControls />
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
});

export default HypeStudio;