import logo from './assets/logo.svg';
import './App.css';
import React, { useState } from 'react';
import { AiOutlineExpand, AiOutlinePlus, AiOutlineImport } from 'react-icons/ai';
import CenterView from './CenterView';
import ProjectsPanel from './ProjectsPanel';
import ImportPanel from './ImportPanel';
import { HypeStudioProvider } from './contexts/HypeStudioContext';

const App = () => {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleSliderChange = (e) => {
    setZoom(e.target.value);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const toggleProjects = () => {
    setProjectsOpen(!projectsOpen);
  };

  const toggleImport = () => {
    setImportOpen(!importOpen);
    if (projectsOpen) setProjectsOpen(false);
  };

  return (
    <HypeStudioProvider>
      <div className="flex h-screen">
        {!expanded && (
          <div className="bg-black w-16 flex flex-col items-center">
            <button onClick={toggleImport} className="text-gray-200 hover:text-white mt-4 flex flex-col items-center">
              <AiOutlineImport size={24} />
              <span className="text-xs mt-1">Import</span>
            </button>
          </div>
        )}
        {importOpen && !expanded && (
          <ImportPanel />
        )}
        {projectsOpen && !expanded && (
          <ProjectsPanel />
        )}
        <div className="flex flex-col flex-grow">
          {!expanded && (
            <div className="bg-white h-8 p-1 pl-4 border-b border-gray-300">
              <button onClick={toggleProjects} className="font-bold">
                Projects
              </button>
            </div>
          )}
          <div className="flex flex-grow overflow-auto items-top p-4 justify-center overflow-hidden" style={{ minWidth: '90%' }}>
            <CenterView zoom={zoom} />
          </div>
          <div className="bg-white h-8 border-t border-gray-300 flex items-center justify-end">
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={handleSliderChange}
              className="mr-4"
            />
            <button onClick={toggleExpand} className="mr-4">
              <AiOutlineExpand size={24} />
            </button>
          </div>
        </div>
      </div>
    </HypeStudioProvider>
  );
};

export default App;