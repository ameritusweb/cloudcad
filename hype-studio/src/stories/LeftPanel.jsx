import React, { useCallback, memo, useState, useMemo } from 'react';
import { FaSquare, FaCircle, FaCube, FaGripLines, FaVectorSquare, FaPlus } from 'react-icons/fa';
import { useHypeStudioModel, useHypeStudioEngines } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import { SettingsView } from './SettingsView';
import { ShapeCreator } from './ShapeCreator';
import { CustomPlanesView } from './CustomPlanesView';

export const LeftPanel = memo(() => {

  const model = useHypeStudioModel();
  const { getTempEngine, getTempScene } = useHypeStudioEngines();
  const activeView = useHypeStudioState('activeView', 'List View');
  const selectedSketchType = useHypeStudioState('selectedSketchType', null);
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const selectedElement = useHypeStudioState('selectedElement', null);
  const elements = useHypeStudioState('elements', {});
  const content = useHypeStudioState('leftPanelContent', []);

  const version = useVersioning(['activeView', 'selectedSketchType', 'selectedElementId', 'leftPanelContent']);

  const handleSketchTypeSelect = useCallback((type) => {
    model.setState(state => ({ ...state, selectedSketchType: type }));
  }, [model]);

  const handleListItemSelect = useCallback((id) => {
    model.selectElement(id);
  }, [model]);

  const handleCreateShape = useCallback((shapeData) => {
    model.createTessellatedShape(getTempScene(), shapeData);
  }, [model]);

  const renderSelectionInfo = () => {
    if (!selectedElement) return null;

    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">Selection Info</h3>
        <p>Type: {selectedElement.type}</p>
        {selectedElement.type === 'edge' && <FaGripLines className="mt-2" size={24} />}
        {selectedElement.type === 'face' && <FaVectorSquare className="mt-2" size={24} />}
        {selectedElement.type === 'mesh' && (
          <p>Shape: {elements.shapes[selectedElement.meshId]?.type}</p>
        )}
      </div>
    );
  };

  return (<div id={`left-panel-${version}`} className="w-48 bg-white p-2 overflow-y-auto">
    <h2 className="font-bold mb-2">{activeView}</h2>
    {activeView === 'Custom Planes View' && <CustomPlanesView />}
    {activeView === 'Settings View' && <SettingsView />}
    {activeView === 'Shape Tool View' && (
        <>
        <ShapeCreator onCreateShape={handleCreateShape} />
        {renderSelectionInfo()}
      </>
      )}
    {activeView === 'Sketch View' && (
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
    )}
    { activeView === 'List View' && (
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
    )}
  </div>
  );
});