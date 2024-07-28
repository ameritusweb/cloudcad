import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import { AiOutlineExpand } from 'react-icons/ai';
import CenterView from './CenterView';

const App = () => {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const handleSliderChange = (e) => {
    setZoom(e.target.value);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="flex h-screen">
      {!expanded && (
        <div className="bg-black w-16"></div>
      )}
      <div className="flex flex-col flex-grow">
        {!expanded && (
          <div className="bg-white h-8 border-b border-gray-300"></div>
        )}
        <div className="flex flex-grow overflow-auto items-center justify-center">
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
  );
};

export default App;