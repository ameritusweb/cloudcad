import { useEffect } from 'react';

export const useScrollWheelEvents = (sceneRef, onWheel) => {
  useEffect(() => {
    const scene = sceneRef.current;

    if (scene) {
      const handleWheel = (evt) => {
        // Normalize the scroll event across different browsers and devices
        const delta = evt.deltaY || evt.detail || evt.wheelDelta;
        onWheel(evt, delta);
      };

      // Attach the wheel event listener to the canvas
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas) {
        canvas.addEventListener('wheel', handleWheel);
      }

      return () => {
        if (canvas) {
          canvas.removeEventListener('wheel', handleWheel);
        }
      };
    }
  }, [sceneRef, onWheel]);
};
