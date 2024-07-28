import React from 'react';
import { AiOutlinePlus } from 'react-icons/ai';

const ProjectsPanel = () => {
  return (
    <div className="bg-white w-32 border-r border-gray-300">
      <div className="flex items-center justify-between p-2 border-b border-gray-300">
        <span>Projects</span>
        <AiOutlinePlus size={24} />
      </div>
    </div>
  );
};

export default ProjectsPanel;
