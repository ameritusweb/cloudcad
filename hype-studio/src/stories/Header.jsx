import React, { memo } from 'react';
import { FaList } from 'react-icons/fa';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import './Header.css'; // We'll create this file for the styles
import sideImage from '../assets/side.png';
import { useVersioning } from '../hooks/useVersioning';

export const Header = memo(() => {
  const projectName = useHypeStudioState('projectName', 'My Project');
  const dimensions = useHypeStudioState('dimensions', '20mm x 40mm x 20mm');

  const version = useVersioning(['projectName', 'dimensions']);

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
      <div className="white-banner">
        <div>{`${projectName} - ${dimensions}`}</div>
      </div>
      <div className="side">
        <img src={sideImage} alt="Side" />
      </div>
    </header>
  );
});