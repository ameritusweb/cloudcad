import * as BABYLON from 'babylonjs';

function extrudeArea(scene, area, height, direction) {
  const extrudedShape = BABYLON.MeshBuilder.ExtrudePolygon("extruded", {
    shape: area,
    depth: Math.abs(height),
    updatable: true
  }, scene);

  if (height < 0) {
    extrudedShape.scaling.y = -1;
  }

  extrudedShape.position = direction.scale(height);

  return extrudedShape;
}

export default extrudeArea;