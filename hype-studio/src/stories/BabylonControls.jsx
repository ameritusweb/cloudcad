import React from 'react';
import { FaSearchPlus, FaHandPaper, FaSyncAlt } from 'react-icons/fa';

export const BabylonControls = ({ 
  currentModelView, 
  controlMode, 
  handleControlModeChange, 
  cyclePlaneState, 
  getButtonStyle 
}) => {
  return (
    <>
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
    </>
  );
};