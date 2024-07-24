import cadquery as cq
from flask import Blueprint, request, jsonify
from .model_manager import ModelManager
from .parametric_feature_functions import circular_cut, concentric_extrude, mirror_feature

# Create a Blueprint
cad_operations = Blueprint('cad_operations', __name__)

# Initialize the ModelManager singleton
model_manager = ModelManager.get_instance()

# Route to create a new model
@cad_operations.route('/create_new_model', methods=['POST'])
def create_new_model():
    try:
        model_id = model_manager.create_new_model()
        return jsonify({"success": True, "modelId": model_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to perform a circular cut on a model
@cad_operations.route('/circular_cut', methods=['POST'])
def circular_cut():
    data = request.json
    model_id = data.get('modelId')
    face_selector = data.get('faceSelector')
    radius = data.get('radius')
    depth = data.get('depth')

    if not all([model_id, face_selector, radius, depth]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager.add_feature(model_id, circular_cut, radius, depth)
        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to perform a concentric extrude on a model
@cad_operations.route('/concentric_extrude', methods=['POST'])
def concentric_extrude():
    data = request.json
    model_id = data.get('modelId')
    face_selector = data.get('faceSelector')
    outer_radius = data.get('outerRadius')
    inner_radius = data.get('innerRadius')
    height = data.get('height')

    if not all([model_id, face_selector, outer_radius, inner_radius, height]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager.add_feature(model_id, concentric_extrude, outer_radius, inner_radius, height)
        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to mirror features of a model
@cad_operations.route('/mirror', methods=['POST'])
def mirror():
    data = request.json
    model_id = data.get('modelId')
    mirror_plane = data.get('mirrorPlane')
    keep_original = data.get('keepOriginal', True)
    align_to_axis = data.get('alignToAxis')
    partial_features = data.get('partialFeatures', {})

    if not all([model_id, mirror_plane]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager.add_feature(model_id, mirror_feature, mirror_plane)
        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to update a parameter in the model
@cad_operations.route('/update_parameter', methods=['POST'])
def update_parameter():
    data = request.json
    model_id = data.get('modelId')
    parameter_name = data.get('parameterName')
    new_value = data.get('newValue')

    if not all([model_id, parameter_name, new_value]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager.update_parameter(model_id, parameter_name, new_value)
        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to get parameters of the model
@cad_operations.route('/get_parameters/<int:model_id>', methods=['GET'])
def get_parameters(model_id):
    try:
        model = model_manager.parametric_models[model_id]
        return jsonify({"success": True, "parameters": model.parameters})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Route to get features of the model
@cad_operations.route('/get_features/<int:model_id>', methods=['GET'])
def get_features(model_id):
    try:
        model = model_manager.parametric_models[model_id]
        return jsonify({"success": True, "features": model.get_features()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
