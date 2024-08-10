import React, { useEffect, useState } from 'react';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const VerticalRuler = () => {
  const model = useHypeStudioModel();
  const [rulerMarkings, setRulerMarkings] = useState([]);

  useEffect(() => {
    // Subscribe to the rulerMarkings state in the HypeStudio model
    const rulerMarkingsSubscription = model.subscribe('rulerMarkings', (newRulerMarkings) => {
      setRulerMarkings(newRulerMarkings);
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      rulerMarkingsSubscription.unsubscribe();
    };
  }, [model]);

  return (
    <div className="absolute left-0 top-0 pb-1 overflow-hidden h-[70%] w-[2rem] bg-white opacity-60 border-r border-gray-500 flex flex-col items-center">
      {rulerMarkings.map((mark, index) => (
        <div
          key={index}
          className={`w-full ${index % 10 === 0 ? 'h-8 border-l-2' : 'h-4'} border-black relative`}
        >
          {index % 10 === 0 && (
            <span className="absolute left-1 top-0 text-[10px]">
              {mark.value / (mark.unit === 'cm' ? 10 : mark.unit === 'm' ? 1000 : 1)} {mark.unit}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
