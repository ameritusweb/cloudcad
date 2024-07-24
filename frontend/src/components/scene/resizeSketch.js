function resizeSketch(sketchMesh, scale) {
    const center = sketchMesh.getBoundingInfo().boundingBox.centerWorld;
    sketchMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
    const newCenter = sketchMesh.getBoundingInfo().boundingBox.centerWorld;
    sketchMesh.position.addInPlace(center.subtract(newCenter));
  }
  
  export default resizeSketch;