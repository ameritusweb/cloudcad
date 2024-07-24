from flask import Blueprint, request, jsonify
from .model_manager import ModelManager

feature_management = Blueprint('feature_management', __name__)

@feature_management.route('/get_features/<int:model_id>', methods=['GET'])
def get_features(model_id):
    try:
        model_manager = ModelManager.get_instance()
        features = model_manager.get_features(model_id)
        return jsonify({"success": True, "features": features})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@feature_management.route('/set_feature_visibility', methods=['POST'])
def set_feature_visibility():
    data = request.json
    model_id = data.get('modelId')
    feature_id = data.get('featureId')
    visible = data.get('visible')

    if not all([model_id, feature_id is not None, visible is not None]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        model_manager.set_feature_visibility(model_id, feature_id, visible)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@feature_management.route('/set_feature_color', methods=['POST'])
def set_feature_color():
    data = request.json
    model_id = data.get('modelId')
    feature_id = data.get('featureId')
    color = data.get('color')

    if not all([model_id, feature_id is not None, color]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        model_manager.set_feature_color(model_id, feature_id, color)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400