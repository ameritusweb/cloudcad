// src/utils/sceneUtils.js

import { MeshBuilder, StandardMaterial, Vector3, Color3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';

export const createControlCube = (scene, onFaceClick) => {
  const cube = MeshBuilder.CreateBox("controlCube", { size: 0.5 }, scene);
  const cubeMaterial = new StandardMaterial("cubeMaterial", scene);
  cubeMaterial.wireframe = true;
  cube.material = cubeMaterial;

  const faceNames = ["Front", "Back", "Left", "Right", "Top", "Bottom"];
  const faceNormals = [
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
    new Vector3(-1, 0, 0),
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0)
  ];

  let hoverFace = null;

  faceNames.forEach((name, index) => {
    const faceMesh = MeshBuilder.CreatePlane(name, { size: 0.65 }, scene);
    faceMesh.parent = cube;
    faceMesh.position = faceNormals[index].scale(0.5);
    faceMesh.lookAt(faceMesh.position.add(faceNormals[index]));

    const faceMaterial = new StandardMaterial(name + "Material", scene);
    faceMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    faceMaterial.alpha = 0.7;
    faceMesh.material = faceMaterial;

    faceMesh.actionManager = new ActionManager(scene);
    faceMesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          onFaceClick(hoverFace || faceNormals[index]);
        }
      )
    );

    faceMesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => {
          faceMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3);
          hoverFace = name;
        }
      )
    );

    faceMesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => {
          faceMaterial.emissiveColor = new Color3(0, 0, 0);
          hoverFace = null;
        }
      )
    );
  });

  return cube;
};

export const getViewFromNormal = (normal) => {
  if (typeof normal === 'string') return normal;
  if (normal.equalsWithEpsilon(Vector3.Right())) return "Right";
  if (normal.equalsWithEpsilon(Vector3.Left())) return "Left";
  if (normal.equalsWithEpsilon(Vector3.Up())) return "Top";
  if (normal.equalsWithEpsilon(Vector3.Down())) return "Bottom";
  if (normal.equalsWithEpsilon(Vector3.Forward())) return "Front";
  if (normal.equalsWithEpsilon(Vector3.Backward())) return "Back";
  return "Front";
};