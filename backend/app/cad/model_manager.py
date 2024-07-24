import json
import uuid
from cadquery import Workplane, Sketch

class ModelManager:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.models = {}
        self.history = {}

    def create_new_model(self):
        from ..models.parametric_model import ParametricModel
        model_id = str(uuid.uuid4())
        self.models[model_id] = ParametricModel()
        self.history[model_id] = []
        return model_id

    def get_model(self, model_id):
        return self.models.get(model_id)

    def add_parameter(self, model_id, name, value):
        model = self.get_model(model_id)
        if model:
            model.add_parameter(name, value)
            self._add_to_history(model_id, 'add_parameter', {'name': name, 'value': value})

    def update_parameter(self, model_id, name, value):
        model = self.get_model(model_id)
        if model:
            old_value = model.parameters.get(name)
            model.update_parameter(name, value)
            self._add_to_history(model_id, 'update_parameter', {'name': name, 'old_value': old_value, 'new_value': value})

    def add_feature(self, model_id, feature_type, *args, **kwargs):
        model = self.get_model(model_id)
        if model:
            feature_id = model.add_feature(feature_type, *args, **kwargs)
            self._add_to_history(model_id, 'add_feature', {'feature_type': feature_type, 'args': args, 'kwargs': kwargs})
            return feature_id

    def remove_feature(self, model_id, feature_id):
        model = self.get_model(model_id)
        if model:
            removed_feature = model.remove_feature(feature_id)
            self._add_to_history(model_id, 'remove_feature', {'feature_id': feature_id, 'feature_data': removed_feature})

    def perform_circular_cut(self, model_id, face_selector, radius, depth):
        model = self.get_model(model_id)
        if model:
            result = model.circular_cut(face_selector, radius, depth)
            self._add_to_history(model_id, 'circular_cut', {'face_selector': face_selector, 'radius': radius, 'depth': depth})
            return result

    def perform_concentric_extrude(self, model_id, face_selector, outer_radius, inner_radius, height):
        model = self.get_model(model_id)
        if model:
            result = model.concentric_extrude(face_selector, outer_radius, inner_radius, height)
            self._add_to_history(model_id, 'concentric_extrude', {
                'face_selector': face_selector,
                'outer_radius': outer_radius,
                'inner_radius': inner_radius,
                'height': height
            })
            return result

    def perform_mirror(self, model_id, mirror_plane, keep_original=True):
        model = self.get_model(model_id)
        if model:
            result = model.mirror(mirror_plane, keep_original)
            self._add_to_history(model_id, 'mirror', {'mirror_plane': mirror_plane, 'keep_original': keep_original})
            return result

    def perform_structural_analysis(self, model_id, material_properties, loads, constraints):
        from ..routes.structural_analysis import StructuralAnalysis
        model = self.get_model(model_id)
        if model:
            analyzer = StructuralAnalysis(model)
            results, failure_points = analyzer.perform_analysis(material_properties, loads, constraints)
            self._add_to_history(model_id, 'structural_analysis', {
                'material_properties': material_properties,
                'loads': loads,
                'constraints': constraints
            })
            return results, failure_points

    def undo(self, model_id):
        if self.history[model_id]:
            action = self.history[model_id].pop()
            self._reverse_action(model_id, action)

    def redo(self, model_id):
        # Implementation depends on how you store redo information
        pass

    def _add_to_history(self, model_id, action_type, action_data):
        self.history[model_id].append({'type': action_type, 'data': action_data})

    def _reverse_action(self, model_id, action):
        model = self.get_model(model_id)
        if model:
            if action['type'] == 'add_parameter':
                model.remove_parameter(action['data']['name'])
            elif action['type'] == 'update_parameter':
                model.update_parameter(action['data']['name'], action['data']['old_value'])
            elif action['type'] == 'add_feature':
                model.remove_last_feature()
            elif action['type'] == 'remove_feature':
                model.add_feature(action['data']['feature_data'])
            # Add more reverse actions for other operation types

    def export_model(self, model_id):
        model = self.get_model(model_id)
        if model:
            export_data = {
                "modelId": model_id,
                "parameters": model.parameters,
                "features": [
                    {
                        "id": feature['id'],
                        "type": feature['type'],
                        "args": feature['args'],
                        "kwargs": feature['kwargs']
                    } for feature in model.features
                ],
                "structuralAnalysis": {
                    "results": model.analysis_results if hasattr(model, 'analysis_results') else None,
                    "failurePoints": model.failure_points if hasattr(model, 'failure_points') else None
                }
            }
            return json.dumps(export_data, indent=2)

    def import_model(self, json_data):
        import_data = json.loads(json_data)
        model_id = self.create_new_model()
        model = self.get_model(model_id)

        for name, value in import_data["parameters"].items():
            model.add_parameter(name, value)

        for feature in import_data["features"]:
            model.add_feature(feature["type"], *feature["args"], **feature["kwargs"])

        if "structuralAnalysis" in import_data:
            model.analysis_results = import_data["structuralAnalysis"]["results"]
            model.failure_points = import_data["structuralAnalysis"]["failurePoints"]

        model.rebuild()
        return model_id

    def get_model_data(self, model_id):
        model = self.get_model(model_id)
        if model:
            return {
                "id": model_id,
                "parameters": model.parameters,
                "features": [
                    {
                        "id": feature['id'],
                        "type": feature['type'],
                        "args": feature['args'],
                        "kwargs": feature['kwargs']
                    } for feature in model.features
                ],
                "boundingBox": model.bounding_box(),
                "vertices": model.vertices(),
                "edges": model.edges(),
                "faces": model.faces()
            }