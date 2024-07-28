import React from 'react';
import { FaList } from 'react-icons/fa';

const Header = ({ projectName, dimensions }) => (
  <header className="bg-blue-600 text-white p-2 flex justify-between items-center">
    <img src="/images/logo.png" alt="HypeStudio Logo" className="h-8" />
    <div className="flex items-center space-x-2">
      <span>{projectName} | {dimensions}</span>
      <button className="bg-blue-500 p-1 rounded">
        <FaList className="text-white" />
      </button>
    </div>
  </header>
);

export default Header;