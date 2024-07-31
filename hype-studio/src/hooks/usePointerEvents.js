// src/hooks/usePointerEvents.js
import { useEffect } from 'react';

export const usePointerEvents = (sceneRef, onPointerDown, onPointerMove, onPointerUp) => {
  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) {
      scene.onPointerDown = (evt) => {
        const pickResult = scene.pick(evt.offsetX, evt.offsetY);
        onPointerDown(evt, pickResult);
      };
      scene.onPointerMove = (evt) => {
        const pickResult = scene.pick(evt.offsetX, evt.offsetY);
        onPointerMove(evt, pickResult);
      };
      scene.onPointerUp = onPointerUp;
    }
    return () => {
      if (scene) {
        scene.onPointerDown = null;
        scene.onPointerMove = null;
        scene.onPointerUp = null;
      }
    };
  }, [sceneRef, onPointerDown, onPointerMove, onPointerUp]);
};