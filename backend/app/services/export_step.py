import cadquery as cq
from flask import request, jsonify, send_file
import tempfile
import os

@app.route('/api/export_step', methods=['POST'])
def export_step():
    data = request.json
    model_data = data['model']

    try:
        # Recreate the model from the data
        # This is a placeholder - you'll need to implement the actual model recreation
        model = recreate_model(model_data)

        # Export the model to a STEP file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.step') as temp_file:
            model.exportStep(temp_file.name)
            temp_filename = temp_file.name

        # Send the file to the client
        return send_file(temp_filename, as_attachment=True, attachment_filename='export.step')
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        if 'temp_filename' in locals():
            os.unlink(temp_filename)