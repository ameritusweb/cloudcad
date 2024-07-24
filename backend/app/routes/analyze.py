from flask import Blueprint, request, jsonify
from .structural_analysis import StructuralAnalysis

structural_analysis = Blueprint('structural_analysis', __name__)

@structural_analysis.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    model_id = data.get('modelId')
    material_properties = data.get('materialProperties')
    loads = data.get('loads')
    constraints = data.get('constraints')

    if not all([model_id, material_properties, loads, constraints]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    try:
        analysis = StructuralAnalysis(model_id)
        results = analysis.perform_analysis(material_properties, loads, constraints)
        return jsonify({"success": True, "results": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500