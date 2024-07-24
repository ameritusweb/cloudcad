from flask import request, jsonify
from OCC.Core.STEPControl import STEPControl_Reader
from OCC.Core.IFSelect import IFSelect_RetDone
from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
from OCC.Core.BRep import BRep_Tool
from OCC.Core.TopExp import TopExp_Explorer
from OCC.Core.TopAbs import TopAbs_FACE
from OCC.Core.TopoDS import topods_Face
import tempfile
import os

@app.route('/api/import_step', methods=['POST'])
def import_step():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.step') or file.filename.endswith('.stp'):
        try:
            # Save the uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.step') as temp_file:
                file.save(temp_file.name)
                temp_filename = temp_file.name

            # Read the STEP file
            step_reader = STEPControl_Reader()
            status = step_reader.ReadFile(temp_filename)

            if status == IFSelect_RetDone:
                step_reader.TransferRoot()
                shape = step_reader.Shape()

                # Mesh the shape
                mesh = BRepMesh_IncrementalMesh(shape, 0.1)
                mesh.Perform()

                # Extract mesh data
                explorer = TopExp_Explorer(shape, TopAbs_FACE)
                faces = []

                while explorer.More():
                    face = topods_Face(explorer.Current())
                    location = BRep_Tool.Location(face)
                    triangulation = BRep_Tool.Triangulation(face, location)
                    
                    if triangulation is not None:
                        vertices = [triangulation.Node(i+1).Transformed(location.Transformation()) for i in range(triangulation.NbNodes())]
                        triangles = [triangulation.Triangle(i+1) for i in range(triangulation.NbTriangles())]
                        
                        face_data = {
                            "vertices": [[v.X(), v.Y(), v.Z()] for v in vertices],
                            "triangles": [[t.Value(1)-1, t.Value(2)-1, t.Value(3)-1] for t in triangles]
                        }
                        faces.append(face_data)

                    explorer.Next()

                # Clean up the temporary file
                os.unlink(temp_filename)

                return jsonify({"faces": faces})
            else:
                return jsonify({"error": "Failed to read STEP file"}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid file type"}), 400