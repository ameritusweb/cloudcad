from flask import request, jsonify
from .model_manager import ModelManager
from .mirror_operation import MirrorOperation
from .cad_exceptions import CADOperationError

@app.route('/api/mirror', methods=['POST'])
def mirror():
    data = request.json
    object_ids = data.get('objectIds')
    mirror_plane = data.get('mirrorPlane')
    keep_original = data.get('keepOriginal', True)
    align_to_axis = data.get('alignToAxis')
    partial_features = data.get('partialFeatures', {})

    if not all([object_ids, mirror_plane]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        objects_to_mirror = [model_manager.get_object(obj_id) for obj_id in object_ids]
        
        mirror_op = MirrorOperation(
            'complex',  # Use 'complex' type for objects that might include circular cuts or concentric extrudes
            objects_to_mirror,
            mirror_plane,
            keep_original,
            align_to_axis,
            partial_features
        )

        updated_model_data = model_manager.apply_mirror_operation(mirror_op)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except CADOperationError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({"success": False, "error": "An unexpected error occurred. Please try again later."}), 500