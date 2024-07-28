import React from 'react';

export const LeftPanel = ({ content }) => (
  <div className="w-48 bg-white p-2 overflow-y-auto">
    <ul>
      {content.map((item, index) => (
        <li key={index} className="py-1 cursor-pointer hover:bg-gray-100">{item}</li>
      ))}
    </ul>
  </div>
);