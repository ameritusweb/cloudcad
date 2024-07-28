import React, { useState, useEffect } from 'react';
import { Header } from './stories/Header';
import { Toolbar } from './stories/Toolbar';
import { LeftPanel } from './stories/LeftPanel';
import { BabylonViewport } from './stories/BabylonViewport';
import { FaSearchPlus, FaHandPaper, FaSyncAlt } from 'react-icons/fa';

const HypeStudio = () => {
  const [activeView, setActiveView] = useState('List View');
  const [leftPanelContent, setLeftPanelContent] = useState([]);
  const [projectInfo, setProjectInfo] = useState({ name: '', dimensions: '' });
  const [currentModelView, setCurrentModelView] = useState('Front');
  const [controlMode, setControlMode] = useState('rotate');

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

  const handleViewChange = (newView) => {
    setCurrentModelView(newView);
    console.log(`View changed to ${newView}`);
  };

  const handleControlModeChange = (mode) => {
    setControlMode(mode);
    console.log(`Control mode changed to ${mode}`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100">
      <Header projectName={projectInfo.name} dimensions={projectInfo.dimensions} />
      <Toolbar activeView={activeView} onItemClick={handleToolbarClick} />
      <div className="flex flex-1">
        <LeftPanel content={leftPanelContent} />
        <div className="flex-1 relative">
          <BabylonViewport onViewChange={handleViewChange} controlMode={controlMode} />
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
        </div>
      </div>
      <img src="/images/banner.png" alt="Banner" className="w-48 absolute bottom-2 left-2" />
    </div>
  );
};

export default HypeStudio;