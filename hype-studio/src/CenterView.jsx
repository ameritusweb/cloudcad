import React from 'react';
import HypeStudio from './HypeStudio';

const CenterView = ({ zoom }) => {
  return (
    <div
      className="w-[80%] h-[80%] flex p-4"
      style={{ transform: `scale(${zoom})` }}
    >
      <HypeStudio />
    </div>
  );
};

export default CenterView;
