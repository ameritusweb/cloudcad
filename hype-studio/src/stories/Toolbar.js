import React, { memo } from 'react';
import MyListIcon from '../assets/list.svg';
import MySketchIcon from '../assets/sketch.svg';
import MyImportExportIcon from '../assets/import-export.svg';
import MyExtrudeIcon from '../assets/extrude.svg';
import MySettingsIcon from '../assets/settings.svg';
import MyMirroringIcon from '../assets/mirror.svg';
import MyPatternIcon from '../assets/pattern.svg';
import MyFormulaIcon from '../assets/formula.svg';
import MyShapeIcon from '../assets/shape.svg';
import MyPlanesIcon from '../assets/planes.svg';
import MyStructuralAnalysisIcon from '../assets/analysis.svg';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import './Toolbar.css';

const toolbarItems = [
  { icon: MyListIcon, name: 'List View' },
  { icon: MySketchIcon, name: 'Sketch View' },
  { icon: MyExtrudeIcon, name: 'Extrude View' },
  { icon: MyImportExportIcon, name: 'Import/Export View' },
  { icon: MyShapeIcon, name: 'Shape Tool View' },
  { icon: MyPlanesIcon, name: 'Custom Planes View'},
  { icon: MyMirroringIcon, name: 'Mirroring View' },
  { icon: MyPatternIcon, name: 'Pattern View' },
  { icon: MyFormulaIcon, name: 'Formula View' },
  { icon: MyStructuralAnalysisIcon, name: 'Structural Analysis View' },
  { icon: MySettingsIcon, name: 'Settings View' },
];

export const Toolbar = memo(() => {

  const model = useHypeStudioModel();
  const activeView = useHypeStudioState('activeView', 'List View');

  const version = useVersioning(['activeView']);

  const handleItemClick = (viewName) => {
    model.setState(state => ({ ...state, activeView: viewName }), false);
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
        <item.icon className="icon-small" />
      </button>
    ))}
  </div>
  );
});