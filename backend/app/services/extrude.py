import cadquery as cq
from flask import request, jsonify

@app.route('/api/extrude', methods=['POST'])
def extrude():
    data = request.json
    sketch_data = data['sketch']
    extrusion_distance = data['distance']

    # Create a workplane and add the sketch
    result = (
        cq.Workplane("XY")
        .moveTo(sketch_data[0]['x'], sketch_data[0]['y'])
        .polyline([(p['x'], p['y']) for p in sketch_data[1:]])
        .close()
        .extrude(extrusion_distance)
    )

    # Convert the result to a mesh or other format that can be sent to the frontend
    # This is a placeholder - you'll need to implement the actual conversion
    mesh_data = convert_to_mesh(result)

    return jsonify({"mesh": mesh_data})