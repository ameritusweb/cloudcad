from flask import request, jsonify
from .model_manager import ModelManager
from .cad_exceptions import CADOperationError

@app.route('/api/circular_cut', methods=['POST'])
def circular_cut():
    data = request.json
    object_id = data.get('objectId')
    face_selector = data.get('faceSelector')
    circle_diameter = data.get('circleDiameter')
    cut_depth = data.get('cutDepth')

    if not all([object_id, face_selector, circle_diameter, cut_depth]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        updated_model_data = model_manager.apply_circular_cut(object_id, face_selector, circle_diameter, cut_depth)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except CADOperationError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({"success": False, "error": "An unexpected error occurred. Please try again later."}), 500