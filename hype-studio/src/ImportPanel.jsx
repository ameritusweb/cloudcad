import React from 'react';
import { AiOutlinePlus } from 'react-icons/ai';

const ImportPanel = () => {
  return (
    <div className="bg-black w-32 border-r border-gray-300">
      <div className="flex items-center justify-between p-2 border-b border-gray-300 text-white">
        <span>Import</span>
        <AiOutlinePlus size={24} />
      </div>
    </div>
  );
};

export default ImportPanel;
