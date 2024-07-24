const handleMirrorApply = async () => {
    if (mirrorType && mirrorPlane && selectedObjects.length > 0) {
      try {
        const response = await axios.post('/api/mirror', {
          mirrorType,
          objectIds: selectedObjects.map(obj => obj.id),
          mirrorPlane: {
            origin: mirrorPlane.origin,
            normal: mirrorPlane.normal
          },
          keepOriginal,
          alignToAxis,
          partialFeatures: Object.fromEntries(
            Object.entries(partialFeatures).filter(([key]) => 
              selectedObjects.some(obj => obj.id.toString() === key)
            )
          )
        });
  
        if (response.data.success) {
          updateBabylonScene(scene, response.data.updatedModel);
          showMessage('Mirroring applied successfully');
        } else {
          showError('Failed to apply mirroring: ' + response.data.error);
        }
      } catch (error) {
        showError('Error applying mirroring: ' + error.message);
      }
      setShowMirrorPreview(false);
    } else {
      showError('Please select mirror type, plane, and objects first');
    }
  };