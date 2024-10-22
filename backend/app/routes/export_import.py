from flask import Blueprint, request, jsonify, send_file
from .model_manager import ModelManager
import io
import json

export_import = Blueprint('export_import', __name__)

@export_import.route('/export_model/<int:model_id>', methods=['GET'])
def export_model(model_id):
    try:
        model_manager = ModelManager.get_instance()
        export_data = model_manager.export_model(model_id)
        
        # Create a BytesIO object
        bytes_io = io.BytesIO(export_data.encode('utf-8'))
        
        # Send the file
        return send_file(
            bytes_io,
            mimetype='application/json',
            as_attachment=True,
            attachment_filename=f'model_{model_id}.json'
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@export_import.route('/import_model', methods=['POST'])
def import_model():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    if file:
        try:
            json_data = file.read().decode('utf-8')
            # Validate JSON structure
            json.loads(json_data)  # This will raise an exception if JSON is invalid
            
            model_manager = ModelManager.get_instance()
            model_id = model_manager.import_model(json_data)
            model_data = model_manager.get_model_data(model_id)
            return jsonify({"success": True, "modelId": model_id, "modelData": model_data})
        except json.JSONDecodeError:
            return jsonify({"success": False, "error": "Invalid JSON format"}), 400
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500
