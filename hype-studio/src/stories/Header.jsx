import React, { memo } from 'react';
import { useHypeStudioState, useHistoryState } from '../hooks/useHypeStudioState';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import './Header.css'; // We'll create this file for the styles
import sideImage from '../assets/side.png';
import UndoIcon from '../assets/left-arrow.svg';
import RedoIcon from '../assets/right-arrow.svg';
import { useVersioning } from '../hooks/useVersioning';

export const Header = memo(() => {
  const model = useHypeStudioModel();
  const projectName = useHypeStudioState('projectName', 'My Project');
  const dimensions = useHypeStudioState('dimensions', '20mm x 40mm x 20mm');
  const version = useVersioning(['projectName', 'dimensions', 'stateVersion']);

  const canUndo = model.canUndo();
  const canRedo = model.canRedo();

  const handleUndo = () => {
    if (model.canUndo()) {
      model.undo();
      model.addNotification('info', 'Undo complete');
    }
  };

  const handleRedo = () => {
    if (model.canRedo()) {
      model.redo();
    }
  };

  return (
    <header id={`header-${version}`}>
      <div className="white-stripes"></div>
      <div className="black-stripes"></div>
      <div className="all-black">
        <div>Hype Studio</div>
      </div>
      <div className="all-blue"></div>
      <div className="right-side"></div>
      <div className="right-higher"></div>
      <div className="white-stripes-right"></div>
      <div className="white-stripes-right-2"></div>
      <div className="white-stripes-right-3"></div>
      <div className="white-stripes-right-4"></div>
      <div className="white-stripes-right-5"></div>
      <div className="white-banner">
        <div>{`${projectName} - ${dimensions}`}</div>
        <div className={`undo cursor-pointer ${canUndo ? 'text-black' : 'opacity-50'}`}>
          <UndoIcon className="undo-icon w-6 h-6" onClick={handleUndo} />
        </div>
        <div className={`redo cursor-pointer ${canRedo ? 'text-black' : 'opacity-50'}`}>
          <RedoIcon className="redo-icon w-6 h-6" onClick={handleRedo} />
        </div>
      </div>
      <div className="side">
        <img src={sideImage} alt="Side" />
      </div>
    </header>
  );
});