import React, { useEffect, useState, memo } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import { FaSearchPlus, FaHandPaper, FaSyncAlt, FaSquare, FaEye, FaCamera, FaMousePointer, FaPencilAlt, FaRuler } from 'react-icons/fa';
import { CameraIcon, CursorArrowRaysIcon } from '@heroicons/react/24/solid';

const PlaneState = {
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  ALIGNED: 'aligned'
};

export const BabylonControls = memo(() => {

  const model = useHypeStudioModel();
  const customPlanes = useHypeStudioState('customPlanes', []);
  const currentModelView = useHypeStudioState('currentModelView', '');
  const controlMode = useHypeStudioState('controlMode', 'rotate');
  const planeStates = useHypeStudioState('planeStates', {
    X: PlaneState.HIDDEN,
    Y: PlaneState.HIDDEN,
    Z: PlaneState.HIDDEN
  });

  const [cameraInfo, setCameraInfo] = useState(model.getState('camera'));

  useEffect(() => {
    const subscription = model.subscribe('camera', (newCameraInfo) => {
      setCameraInfo(newCameraInfo);
    });

    return () => subscription.unsubscribe();
  }, [model]);

  const { position, target } = cameraInfo;

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
      <div id={`babylon-controls-${version}`} className="absolute top-2 right-2 text-white bg-black hover:bg-opacity-100 bg-opacity-50 p-2 rounded">
        Current View: {currentModelView}
      </div>
      <div className="absolute bottom-[3.5rem] right-2 flex space-x-2">
      <button 
          title={'Pointer Mode'}
          onClick={() => handleControlModeChange('pointer')}
          className={`p-2 rounded ${controlMode === 'pointer' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaMousePointer />
        </button>
        <button 
          title={'Drawing Mode'}
          onClick={() => handleControlModeChange('drawing')}
          className={`p-2 rounded ${controlMode === 'drawing' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaPencilAlt />
        </button>
        <button 
          title={'Dimension Mode'}
          onClick={() => handleControlModeChange('dimension')}
          className={`p-2 rounded ${controlMode === 'dimension' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaRuler />
        </button>
        <button 
          title={'Zoom'}
          onClick={() => handleControlModeChange('zoom')}
          className={`p-2 rounded ${controlMode === 'zoom' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaSearchPlus />
        </button>
        <button 
          title={'Pan'}
          onClick={() => handleControlModeChange('pan')}
          className={`p-2 rounded ${controlMode === 'pan' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaHandPaper />
        </button>
        <button 
          title={'Rotate'}
          onClick={() => handleControlModeChange('rotate')}
          className={`p-2 rounded ${controlMode === 'rotate' ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-opacity-100 bg-opacity-50 text-white`}
        >
          <FaSyncAlt />
        </button>
      </div>
      <div className="absolute bottom-[3.5rem] left-2 flex space-x-2 flex-wrap">
      {['X', 'Y', 'Z', ...customPlanes.map(plane => plane.id)].map(plane => {
        const { bgColor, icon } = getButtonStyle(plane);
        return (
          <button 
            key={plane}
            onClick={() => onCyclePlaneState(plane)}
            className={`p-2 rounded ${bgColor} text-white flex items-center hover:bg-opacity-100 bg-opacity-50 justify-center w-12 h-12 mb-2`}
          >
            {icon}
            <span className="ml-1">{plane.slice(-1)}</span>
          </button>
        );
      })}
    </div>
          <div className={`absolute bottom-2 w-full h-[2.5rem] left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded shadow flex items-center space-x-2`}
          >     
              <CameraIcon className="w-5 h-5" />
              {position !== null && target !== null && (
              <span>
                {position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)}
              </span>
              )}
              <CursorArrowRaysIcon className="w-5 h-5 ml-2" />
              {position !== null && target !== null && (
              <span>
                {target.x.toFixed(1)}, {target.y.toFixed(1)}, {target.z.toFixed(1)}
              </span>
              )}
          </div>
    </>
  );
});