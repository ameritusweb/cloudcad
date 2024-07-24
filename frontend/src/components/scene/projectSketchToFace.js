import * as BABYLON from 'babylonjs';

function projectSketchToFace(sketch, face, scene) {
  // Calculate face normal and center
  const positions = face.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const indices = face.getIndices();
  const v1 = BABYLON.Vector3.FromArray(positions, indices[0] * 3);
  const v2 = BABYLON.Vector3.FromArray(positions, indices[1] * 3);
  const v3 = BABYLON.Vector3.FromArray(positions, indices[2] * 3);
  const normal = BABYLON.Vector3.Cross(v2.subtract(v1), v3.subtract(v1)).normalize();
  const center = v1.add(v2).add(v3).scale(1/3);

  // Create a plane aligned with the face
  const plane = new BABYLON.Plane.FromPoints(v1, v2, v3);

  // Project sketch points onto the plane
  const projectedPoints = sketch.points.map(point => {
    const ray = new BABYLON.Ray(center, new BABYLON.Vector3(point.x, point.y, 0));
    return ray.intersectsPlane(plane);
  });

  // Create lines for the projected sketch
  const lines = [];
  for (let i = 0; i < projectedPoints.length - 1; i++) {
    lines.push([projectedPoints[i], projectedPoints[i+1]]);
  }
  lines.push([projectedPoints[projectedPoints.length - 1], projectedPoints[0]]);

  // Create a mesh for the projected sketch
  const sketchMesh = BABYLON.MeshBuilder.CreateLineSystem("sketch", {lines: lines}, scene);
  
  return sketchMesh;
}

export default projectSketchToFace;