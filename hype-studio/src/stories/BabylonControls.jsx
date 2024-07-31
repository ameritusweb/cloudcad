import React, { useRef, useState, memo } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import { FaSearchPlus, FaHandPaper, FaSyncAlt, FaSquare, FaEye, FaCamera } from 'react-icons/fa';

const PlaneState = {
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  ALIGNED: 'aligned'
};

export const BabylonControls = memo(() => {

  const model = useHypeStudioModel();
  const currentModelView = useHypeStudioState('currentModelView', '');
  const controlMode = useHypeStudioState('controlMode', 'rotate');
  const planeStates = useHypeStudioState('planeStates', {
    X: PlaneState.HIDDEN,
    Y: PlaneState.HIDDEN,
    Z: PlaneState.HIDDEN
  });

  const version = useVersioning(['currentModelView', 'controlMode', 'planeStates']);

  const handleControlModeChange = (mode) => {
    model.setState(state => ({ ...state, controlMode: mode }));
  };

  const onCyclePlaneState = (plane) => {
    model.setState(state => {
      const currentState = state.planeStates[plane];
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
      
      return { 
        ...state, 
        planeStates: { 
          ...state.planeStates, 
          [plane]: newState 
        } 
      };
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
    <>
      <div id={`babylon-controls-${version}`} className="absolute top-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded">
        Current View: {currentModelView}
      </div>
      <div className="absolute bottom-[2rem] right-2 flex space-x-2">
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
      <div className="absolute bottom-[2rem] left-2 flex space-x-2">
        {['X', 'Y', 'Z'].map(plane => {
          const { bgColor, icon } = getButtonStyle(plane);
          return (
            <button 
              key={plane}
              onClick={() => onCyclePlaneState(plane)}
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
});