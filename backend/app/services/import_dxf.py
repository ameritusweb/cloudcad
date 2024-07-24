import ezdxf
from flask import request, jsonify

@app.route('/api/import_dxf', methods=['POST'])
def import_dxf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.dxf'):
        try:
            doc = ezdxf.readfile(file)
            msp = doc.modelspace()
            entities = []
            for e in msp:
                if e.dxftype() == 'LINE':
                    entities.append({
                        'type': 'LINE',
                        'start': list(e.dxf.start),
                        'end': list(e.dxf.end)
                    })
                elif e.dxftype() == 'CIRCLE':
                    entities.append({
                        'type': 'CIRCLE',
                        'center': list(e.dxf.center),
                        'radius': e.dxf.radius
                    })
                # Add more entity types as needed
            return jsonify({"entities": entities})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid file type"}), 400