import React, { memo, useCallback, useState } from 'react';
import MyListIcon from '../assets/list.svg?react';
import MySketchIcon from '../assets/sketch.svg?react';
import MyImportExportIcon from '../assets/import-export.svg?react';
import MyExtrudeIcon from '../assets/extrude.svg?react';
import MySettingsIcon from '../assets/settings.svg?react';
import MyMirroringIcon from '../assets/mirror.svg?react';
import MyPatternIcon from '../assets/pattern.svg?react';
import MyFormulaIcon from '../assets/formula.svg?react';
import MyShapeIcon from '../assets/shape.svg?react';
import MyPlanesIcon from '../assets/planes.svg?react';
import MyStructuralAnalysisIcon from '../assets/analysis.svg?react';
import MyBackIcon from '../assets/back.svg?react';
import MyShatterIcon from '../assets/shatter.svg?react';
import MyTwistIcon from '../assets/twist.svg?react';
import MySliceIcon from '../assets/slice.svg?react';
import MySweepIcon from '../assets/sweep.svg?react';
import MyRayIcon from '../assets/ray.svg?react';
import MyPointIcon from '../assets/point.svg?react';
import MyCrushIcon from '../assets/crush.svg?react';
import MyBendIcon from '../assets/bend.svg?react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import './Toolbar.css';

const mainToolbarItems = [
  { icon: MyListIcon, name: 'List View' },
  { icon: MySketchIcon, name: 'Sketch View' },
  { icon: MyExtrudeIcon, name: 'Extrude View' },
  { icon: MyImportExportIcon, name: 'Import/Export View' },
  { icon: MyShapeIcon, name: 'Shape Tool View' },
  { icon: MyPlanesIcon, name: 'Custom Planes View' },
  { icon: MyMirroringIcon, name: 'Mirroring View' },
  { icon: MyPatternIcon, name: 'Pattern View' },
  { icon: MyFormulaIcon, name: 'Formula View' },
  { icon: MyStructuralAnalysisIcon, name: 'Structural Analysis View' },
  { icon: MySettingsIcon, name: 'Settings View' },
];

const shapeToolbarItems = [
  { icon: MyBackIcon, name: 'Back' },
  { icon: MyBendIcon, name: 'Bend Tool View' },
  { icon: MyTwistIcon, name: 'Twist Tool View' },
  { icon: MySliceIcon, name: 'Slice Tool View' },
  { icon: MySweepIcon, name: 'Sweep Tool View' },
  { icon: MyCrushIcon, name: 'Crush Tool View' },
  { icon: MyPointIcon, name: 'Point Tool View' },
  { icon: MyRayIcon, name: 'Ray Tool View' },
  { icon: MyShatterIcon, name: 'Shatter Tool View' },
];

export const Toolbar = memo(() => {
  const model = useHypeStudioModel();
  const activeView = useHypeStudioState('activeView', 'List View');
  const version = useVersioning(['activeView']);
  const [isShapeToolActive, setIsShapeToolActive] = useState(false);

  const handleItemClick = useCallback((viewName) => {
    if (viewName === 'Back') {
      setIsShapeToolActive(false);
      model.setState(state => ({ ...state, activeView: 'List View' }), false);
    } else if (viewName === 'Shape Tool View') {
      setIsShapeToolActive(true);
      model.setState(state => ({ ...state, activeView: viewName }), false);
    } else {
      model.setState(state => ({ ...state, activeView: viewName }), false);
    }
  }, [model]);

  const toolbarItems = isShapeToolActive ? shapeToolbarItems : mainToolbarItems;

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
