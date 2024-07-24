import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';

const PlaneSelection = ({ onPlaneSelected }) => {
  const sceneRef = useRef(null);

  useEffect(() => {
    if (sceneRef.current) {
      const engine = new BABYLON.Engine(sceneRef.current);
      const scene = new BABYLON.Scene(engine);

      const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 5, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(sceneRef.current, true);

      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

      // Create planes
      const planeXY = BABYLON.MeshBuilder.CreatePlane("planeXY", { size: 2 }, scene);
      const planeYZ = BABYLON.MeshBuilder.CreatePlane("planeYZ", { size: 2 }, scene);
      const planeXZ = BABYLON.MeshBuilder.CreatePlane("planeXZ", { size: 2 }, scene);

      planeYZ.rotation.y = Math.PI / 2;
      planeXZ.rotation.x = Math.PI / 2;

      // Add click event to planes
      [planeXY, planeYZ, planeXZ].forEach(plane => {
        plane.actionManager = new BABYLON.ActionManager(scene);
        plane.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => onPlaneSelected(plane.name)
          )
        );
      });

      engine.runRenderLoop(() => scene.render());

      return () => {
        engine.dispose();
      };
    }
  }, [onPlaneSelected]);

  return <canvas ref={sceneRef} style={{ width: '100%', height: '300px' }} />;
};

export default PlaneSelection;