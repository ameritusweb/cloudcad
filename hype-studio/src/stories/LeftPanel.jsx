import React, { useCallback, memo, useState, useMemo } from 'react';
import { FaSquare, FaCircle, FaCube, FaGripLines, FaVectorSquare, FaPlus } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import { SettingsView } from './SettingsView';

const ShapeCreator = ({ onCreateShape }) => {
  const [shapeType, setShapeType] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 100, height: 100, depth: 100, diameter: 100 }); // in mm
  const [complexity, setComplexity] = useState(1);

  const handleDimensionChange = (dim, value) => {
    setDimensions(prev => ({ ...prev, [dim]: parseFloat(value) }));
  };

  const triangleDensityTarget = useMemo(() => {
    // Base density is 1 triangle per 100 mm² at complexity 1
    // Double the density for each complexity level
    return Math.pow(2, complexity - 1) / 100; // triangles per mm²
  }, [complexity]);

  const estimatedTriangles = useMemo(() => {
    if (!shapeType) return 0;

    let surfaceArea;

    if (shapeType === 'box') {
      surfaceArea = 2 * (
        dimensions.width * dimensions.height +
        dimensions.width * dimensions.depth +
        dimensions.height * dimensions.depth
      );
    } else { // cylinder
      const radius = dimensions.diameter / 2;
      surfaceArea = 2 * Math.PI * radius * (radius + dimensions.height);
    }

    return Math.ceil(surfaceArea * triangleDensityTarget);
  }, [shapeType, dimensions, triangleDensityTarget]);

  const handleCreateShape = () => {
    onCreateShape({
      type: shapeType,
      params: shapeType === 'box' 
        ? { width: dimensions.width, height: dimensions.height, depth: dimensions.depth }
        : { height: dimensions.height, diameter: dimensions.diameter },
      triangleDensityTarget,
      estimatedTriangles
    });
    setShapeType(null);
  };

  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2">Create Shape</h3>
      <div className="flex mb-2">
        <button 
          title={`Box`}
          onClick={() => setShapeType('box')} 
          className={`mr-2 p-2 ${shapeType === 'box' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <FaCube />
        </button>
        <button 
          title={`Cylinder`}
          onClick={() => setShapeType('cylinder')} 
          className={`p-2 ${shapeType === 'cylinder' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <FaCircle />
        </button>
      </div>
      {shapeType && (
        <>
          <div className="mb-2">
            <label className="block">Complexity:</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={complexity} 
              onChange={(e) => setComplexity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mb-2">
            <label className="block">Triangle Density Target:</label>
            <p className="text-sm text-gray-600">
              {triangleDensityTarget.toFixed(4)} triangles per mm²
            </p>
          </div>
          <div className="mb-2">
            <label className="block">Estimated Triangles:</label>
            <p className="text-sm text-gray-600">
              {estimatedTriangles.toLocaleString()}
            </p>
          </div>
          {shapeType === 'box' ? (
            <>
              <div className="mb-2 inline-flex">
                <label className="block p-1">Width:</label>
                <input 
                  type="number" 
                  value={dimensions.width} 
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  step="0.1"
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="mb-2 inline-flex">
                <label className="block p-1">Height:</label>
                <input 
                  type="number" 
                  value={dimensions.height} 
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  step="0.1"
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="mb-2 inline-flex">
                <label className="block p-1">Depth:</label>
                <input 
                  type="number" 
                  value={dimensions.depth} 
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                  step="0.1"
                  className="w-full p-1 border rounded"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 inline-flex">
                <label className="block p-1">Height:</label>
                <input 
                  type="number" 
                  value={dimensions.height} 
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  step="0.1"
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="mb-2 inline-flex">
                <label className="block p-1">Diameter:</label>
                <input 
                  type="number" 
                  value={dimensions.diameter} 
                  onChange={(e) => handleDimensionChange('diameter', e.target.value)}
                  step="0.1"
                  className="w-full p-1 border rounded"
                />
              </div>
            </>
          )}
          <button 
            onClick={handleCreateShape}
            className="w-full bg-green-500 text-white p-2 rounded flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Add Shape
          </button>
        </>
      )}
    </div>
  );
};

export const LeftPanel = memo(() => {

  const model = useHypeStudioModel();
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
    model.createTessellatedShape(shapeData);
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