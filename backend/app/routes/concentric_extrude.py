from flask import request, jsonify
from .model_manager import ModelManager
from .cad_exceptions import CADOperationError

@app.route('/api/concentric_extrude', methods=['POST'])
def concentric_extrude():
    data = request.json
    object_id = data.get('objectId')
    face_selector = data.get('faceSelector')
    outer_diameter = data.get('outerDiameter')
    inner_diameter = data.get('innerDiameter')
    extrude_height = data.get('extrudeHeight')

    if not all([object_id, face_selector, outer_diameter, inner_diameter, extrude_height]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        updated_model_data = model_manager.apply_concentric_extrude(
            object_id, face_selector, outer_diameter, inner_diameter, extrude_height
        )
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except CADOperationError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({"success": False, "error": "An unexpected error occurred. Please try again later."}), 500