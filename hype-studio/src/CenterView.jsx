import React from 'react';
import HypeStudio from './HypeStudio';

const CenterView = ({ zoom }) => {
  return (
    <div
      className="bg-gray-200 w-[80%] h-[80%] flex items-center justify-center"
      style={{ transform: `scale(${zoom})` }}
    >
      <HypeStudio />
    </div>
  );
};

export default CenterView;
