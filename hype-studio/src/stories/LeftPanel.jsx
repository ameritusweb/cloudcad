import React, { useCallback, memo } from 'react';
import { FaSquare, FaCircle } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';

export const LeftPanel = memo(() => {

  const model = useHypeStudioModel();
  const activeView = useHypeStudioState('activeView', 'List View');
  const selectedSketchType = useHypeStudioState('selectedSketchType', null);
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const content = useHypeStudioState('leftPanelContent', []);

  const version = useVersioning(['activeView', 'selectedSketchType', 'selectedElementId', 'leftPanelContent']);

  const handleSketchTypeSelect = useCallback((type) => {
    model.setState(state => ({ ...state, selectedSketchType: type }));
  }, [model]);

  const handleListItemSelect = useCallback((id) => {
    model.selectElement(id);
  }, [model]);

  return (<div id={`left-panel-${version}`} className="w-48 bg-white p-2 overflow-y-auto">
    <h2 className="font-bold mb-2">{activeView}</h2>
    {activeView === 'Sketch View' ? (
      <ul>
        <li 
          onClick={() => handleSketchTypeSelect('circle')} 
          className={`py-2 px-1 cursor-pointer hover:bg-gray-100 flex items-center ${selectedSketchType === 'circle' ? 'bg-blue-100' : ''}`}
        >
          <FaCircle className="mr-2" />
          Circle
        </li>
        <li 
          onClick={() => handleSketchTypeSelect('rectangle')} 
          className={`py-2 px-1 cursor-pointer hover:bg-gray-100 flex items-center ${selectedSketchType === 'rectangle' ? 'bg-blue-100' : ''}`}
        >
          <FaSquare className="mr-2" />
          Rectangle
        </li>
      </ul>
    ) : activeView === 'List View' ? (
      <ul>
        {content.map((item) => (
          <li 
            key={item.id}
            onClick={() => handleListItemSelect(item.id)}
            className={`py-2 px-1 cursor-pointer hover:bg-gray-100 flex items-center ${selectedElementId === item.id ? 'bg-blue-100' : ''}`}
          >
            {item.type === 'circle' ? <FaCircle className="mr-2" /> : <FaSquare className="mr-2" />}
            {item.name}
          </li>
        ))}
      </ul>
    ) : (
      <ul>
        {content.map((item, index) => (
          <li key={index} className="py-1 cursor-pointer hover:bg-gray-100">{item}</li>
        ))}
      </ul>
    )}
  </div>
  );
});