from flask import request, jsonify
from .model_manager import ModelManager

@app.route('/api/update_parameter', methods=['POST'])
def update_parameter():
    data = request.json
    model_id = data.get('modelId')
    parameter_name = data.get('parameterName')
    new_value = data.get('newValue')

    if not all([model_id, parameter_name, new_value]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        model_manager.update_parameter(model_id, parameter_name, new_value)
        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400