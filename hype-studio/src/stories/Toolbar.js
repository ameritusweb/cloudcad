import React from 'react';
import { FaList, FaPencilAlt, FaCube, FaGlobe, FaDrawPolygon, FaRuler } from 'react-icons/fa';

const toolbarItems = [
  { icon: FaList, name: 'List View' },
  { icon: FaPencilAlt, name: 'Sketch View' },
  { icon: FaCube, name: 'Extrude View' },
  { icon: FaGlobe, name: 'Import/Export View' },
  { icon: FaDrawPolygon, name: 'Fillet/Chamfer View' },
  { icon: FaRuler, name: 'Dimension Tool View' },
];

export const Toolbar = ({ activeView, onItemClick }) => (
  <div className="bg-white p-2 flex space-x-4">
    {toolbarItems.map((item, index) => (
      <button
        key={index}
        onClick={() => onItemClick(item.name)}
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