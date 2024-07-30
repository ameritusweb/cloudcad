import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Engine } from '@babylonjs/core';
import { Header } from './stories/Header';
import { Toolbar } from './stories/Toolbar';
import { LeftPanel } from './stories/LeftPanel';
import { BabylonViewport } from './stories/BabylonViewport';
import { PropertyPanel } from './stories/PropertyPanel';  // Import the new PropertyPanel
import { FaSearchPlus, FaHandPaper, FaSyncAlt, FaSquare, FaEye, FaCamera } from 'react-icons/fa';
import { useHypeStudioModel } from './contexts/HypeStudioContext';  // Import the context hook

// Enum for plane states
const PlaneState = {
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  ALIGNED: 'aligned'
};

const HypeStudio = () => {
  const model = useHypeStudioModel();  // Use the HypeStudio model
  const [activeView, setActiveView] = useState('List View');
  const [leftPanelContent, setLeftPanelContent] = useState([]);
  const [projectInfo, setProjectInfo] = useState({ name: '', dimensions: '' });
  const [currentModelView, setCurrentModelView] = useState('');
  const [currentModelSelection, setCurrentModelSelection] = useState('');
  const [controlMode, setControlMode] = useState('rotate');
  const [planeStates, setPlaneStates] = useState({
    X: PlaneState.HIDDEN,
    Y: PlaneState.HIDDEN,
    Z: PlaneState.HIDDEN
  });
  // New state for the engine
  const [engine, setEngine] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Create the engine
    if (canvasRef.current && !engine) {
      const newEngine = new Engine(canvasRef.current, true);
      setEngine(newEngine);

      // Set up the resize event listener
      window.addEventListener('resize', () => newEngine.resize());

      // Cleanup function
      return () => {
        window.removeEventListener('resize', () => newEngine.resize());
        newEngine.dispose();
      };
    }
  }, []);

  useEffect(() => {
    // Fetch project info
    fetch('/api/project')
      .then(res => res.json())
      .then(data => setProjectInfo(data));
    
    // Fetch initial left panel content
    fetchLeftPanelContent('List View');
  }, []);

  const fetchLeftPanelContent = (viewName) => {
    fetch(`/api/${viewName.toLowerCase().replace(' ', '-')}`)
      .then(res => res.json())
      .then(data => setLeftPanelContent(data));
  };

  const handleToolbarClick = (viewName) => {
    setActiveView(viewName);
    fetchLeftPanelContent(viewName);
  };

  const handleViewChange = useCallback((newView) => {
    setCurrentModelView(newView);
    console.log(`View changed to ${newView}`);
  }, []);

  const handleSelectionChange = useCallback((newSelection) => {
    setCurrentModelSelection(newSelection);
    console.log(`Selection changed to ${newSelection}`);
  }, []);

  const handleControlModeChange = (mode) => {
    setControlMode(mode);
    console.log(`Control mode changed to ${mode}`);
  };

  const cyclePlaneState = (plane) => {
    setPlaneStates(prevStates => {
      const currentState = prevStates[plane];
      let newState;
      switch (currentState) {
        case PlaneState.HIDDEN:
          newState = PlaneState.VISIBLE;
          break;
        case PlaneState.VISIBLE:
          newState = PlaneState.ALIGNED;
          break;
        case PlaneState.ALIGNED:
          newState = PlaneState.HIDDEN;
          break;
        default:
          newState = PlaneState.HIDDEN;
      }
      return { ...prevStates, [plane]: newState };
    });
  };

  const getButtonStyle = (plane) => {
    const state = planeStates[plane];
    let bgColor, icon;
    switch (state) {
      case PlaneState.VISIBLE:
        bgColor = 'bg-blue-500';
        icon = <FaEye />;
        break;
      case PlaneState.ALIGNED:
        bgColor = 'bg-green-500';
        icon = <FaCamera />;
        break;
      default:
        bgColor = 'bg-gray-500';
        icon = <FaSquare />;
    }
    return { bgColor, icon };
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100">
      <Header projectName={projectInfo.name} dimensions={projectInfo.dimensions} />
      <Toolbar activeView={activeView} onItemClick={handleToolbarClick} />
      <div className="flex flex-1">
        <LeftPanel content={leftPanelContent} />
        <div className="flex-1 relative">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          {engine && (
            <BabylonViewport 
              engine={engine}
              canvas={canvasRef.current}
              onViewChange={handleViewChange} 
              onSelectionChange={handleSelectionChange}
              controlMode={controlMode} 
              planeStates={planeStates}
            />
          )}
          <div className="absolute top-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded">
            Current View: {currentModelView}
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <button 
              onClick={() => handleControlModeChange('zoom')}
              className={`p-2 rounded ${controlMode === 'zoom' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
            >
              <FaSearchPlus />
            </button>
            <button 
              onClick={() => handleControlModeChange('pan')}
              className={`p-2 rounded ${controlMode === 'pan' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
            >
              <FaHandPaper />
            </button>
            <button 
              onClick={() => handleControlModeChange('rotate')}
              className={`p-2 rounded ${controlMode === 'rotate' ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
            >
              <FaSyncAlt />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex space-x-2">
            {['X', 'Y', 'Z'].map(plane => {
              const { bgColor, icon } = getButtonStyle(plane);
              return (
                <button 
                  key={plane}
                  onClick={() => cyclePlaneState(plane)}
                  className={`p-2 rounded ${bgColor} text-white flex items-center justify-center w-12 h-12`}
                >
                  {icon}
                  <span className="ml-1">{plane}</span>
                </button>
              );
            })}
          </div>
        </div>
        <PropertyPanel />  {/* Add the PropertyPanel here */}
      </div>
      <img src="/images/banner.png" alt="Banner" className="w-48 absolute bottom-2 left-2" />
    </div>
  );
};

export default HypeStudio;