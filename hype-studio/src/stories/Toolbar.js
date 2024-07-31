import React, { memo } from 'react';
import { FaList, FaPencilAlt, FaCube, FaGlobe, FaDrawPolygon, FaRuler } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';

const toolbarItems = [
  { icon: FaList, name: 'List View' },
  { icon: FaPencilAlt, name: 'Sketch View' },
  { icon: FaCube, name: 'Extrude View' },
  { icon: FaGlobe, name: 'Import/Export View' },
  { icon: FaDrawPolygon, name: 'Fillet/Chamfer View' },
  { icon: FaRuler, name: 'Dimension Tool View' },
];

export const Toolbar = memo(() => {

  const model = useHypeStudioModel();
  const activeView = useHypeStudioState('activeView', 'List View');

  const version = useVersioning(['activeView']);

  const handleItemClick = (viewName) => {
    model.setState(state => ({ ...state, activeView: viewName }));
  };

  return (
  <div id={`toolbar-${version}`} className="bg-white p-2 flex space-x-4">
    {toolbarItems.map((item, index) => (
      <button
        key={index}
        onClick={() => handleItemClick(item.name)}
        title={item.name}
        className={`p-2 rounded transition-all duration-200 ease-in-out ${
          activeView === item.name 
            ? 'bg-blue-200 outline outline-2 outline-green-500' 
            : 'hover:bg-blue-100'
        }`}
      >
        <item.icon />
      </button>
    ))}
  </div>
  );
});