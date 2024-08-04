import React, { useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { Vector3 } from '@babylonjs/core';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useVersioning } from '../hooks/useVersioning';

export const CustomPlanesView = () => {
    const model = useHypeStudioModel();
    const customPlanes = useHypeStudioState('customPlanes', []);
    const [normal, setNormal] = useState({ x: 0, y: 0, z: 1 });
  
    const version = useVersioning(['customPlanes']);

    const availableLetters = () => {
      const usedLetters = new Set(customPlanes.map(plane => plane.id.charAt(plane.id.length - 1)));
      return 'ABCDEFGHIJKLMNOPQRSTUVW'.split('').filter(letter => !usedLetters.has(letter));
    };
  
    const handleAddPlane = () => {
      if (availableLetters().length === 0) return; // No more letters available
  
      const newPlaneLetter = availableLetters()[0];
      const normalized = new Vector3(normal.x, normal.y, normal.z).normalize();
      const newPlane = {
        id: `custom_plane_${newPlaneLetter}`,
        normal: {
            x: normalized.x.toFixed(4),
            y: normalized.y.toFixed(4),
            z: normalized.z.toFixed(4)
        },
      };
      model.setState(state => ({
        ...state,
        customPlanes: [...state.customPlanes, newPlane],
        planeStates: {
          ...state.planeStates,
          [newPlane.id]: 'hidden',
        },
      }));
      setNormal({ x: 0, y: 0, z: 1 }); // Reset input after adding
    };
  
    return (
      <div className="space-y-4" id={`custom-planes-view-v-${version}`}>
        <h3 className="text-lg font-semibold text-gray-700">Custom Planes</h3>
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis} className="flex flex-col">
                <label htmlFor={`normal-${axis}`} className="text-sm font-medium text-gray-600 mb-1">
                  {axis.toUpperCase()}
                </label>
                <input
                  id={`normal-${axis}`}
                  type="number"
                  value={normal[axis]}
                  onChange={(e) => setNormal({ ...normal, [axis]: parseFloat(e.target.value) })}
                  className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAddPlane}
            disabled={availableLetters().length === 0}
            className={`w-full font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out flex items-center justify-center
              ${availableLetters().length > 0 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <FaPlus className="mr-2" /> Add Plane
          </button>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {customPlanes.map((plane) => 
              (<li key={plane.id} className="p-4 hover:bg-gray-50 transition duration-150 ease-in-out">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Plane {plane.id.charAt(plane.id.length - 1)}: ({Number(plane.normal.x).toFixed(2)}, {Number(plane.normal.y).toFixed(2)}, {Number(plane.normal.z).toFixed(2)})
                  </span>
                  <button
                    onClick={() => model.deleteCustomPlane(plane.id)}
                    className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>)
            )}
          </ul>
        </div>
      </div>
    );
  };