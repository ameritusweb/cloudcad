from flask import request, jsonify
from .model_manager import ModelManager
from .parametric_feature_functions import circular_cut, concentric_extrude, mirror_feature

@app.route('/api/add_feature', methods=['POST'])
def add_feature():
    data = request.json
    model_id = data.get('modelId')
    feature_type = data.get('featureType')
    parameters = data.get('parameters', {})

    if not all([model_id, feature_type]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        model_manager = ModelManager.get_instance()
        
        if feature_type == 'circular_cut':
            model_manager.add_feature(model_id, circular_cut, parameters['radius'], parameters['depth'])
        elif feature_type == 'concentric_extrude':
            model_manager.add_feature(model_id, concentric_extrude, parameters['outerRadius'], parameters['innerRadius'], parameters['height'])
        elif feature_type == 'mirror':
            model_manager.add_feature(model_id, mirror_feature, parameters['mirrorPlane'])
        else:
            return jsonify({"success": False, "error": f"Unknown feature type: {feature_type}"}), 400

        model_manager.rebuild_model(model_id)
        updated_model_data = model_manager.get_model_data(model_id)
        return jsonify({"success": True, "updatedModel": updated_model_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400