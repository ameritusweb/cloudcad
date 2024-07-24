import cadquery as cq
import json
from .parametric_feature_functions import circular_cut, concentric_extrude, mirror_feature

class ParametricModel:
    def __init__(self):
        self.parameters = {}
        self.features = []
        self.workplane = cq.Workplane("XY")

    def add_parameter(self, name, value):
        self.parameters[name] = value

    def update_parameter(self, name, value):
        if name in self.parameters:
            self.parameters[name] = value
            self.rebuild()
        else:
            raise ValueError(f"Parameter {name} does not exist")

    def add_feature(self, feature_func, *args, **kwargs):
        feature_id = len(self.features)
        self.features.append({
            'id': feature_id,
            'func': feature_func,
            'args': args,
            'kwargs': kwargs,
            'visible': True,
            'color': (0.7, 0.7, 0.7)  # Default color (light gray)
        })
        return feature_id

    def set_feature_visibility(self, feature_id, visible):
        if 0 <= feature_id < len(self.features):
            self.features[feature_id]['visible'] = visible
            self.rebuild()
        else:
            raise ValueError(f"Invalid feature ID: {feature_id}")

    def set_feature_color(self, feature_id, color):
        if 0 <= feature_id < len(self.features):
            self.features[feature_id]['color'] = color
            self.rebuild()
        else:
            raise ValueError(f"Invalid feature ID: {feature_id}")

    def rebuild(self):
        self.workplane = cq.Workplane("XY")
        for feature in self.features:
            if feature['visible']:
                func = feature['func']
                args = [self.parameters.get(arg, arg) for arg in feature['args']]
                kwargs = {k: self.parameters.get(v, v) for k, v in feature['kwargs'].items()}
                self.workplane = func(self.workplane, *args, **kwargs)

    def get_model(self):
        return self.workplane

    def get_features(self):
        return [{'id': f['id'], 'visible': f['visible'], 'color': f['color']} for f in self.features]


class ModelManager:
    _instance = None

    @staticmethod
    def get_instance():
        if ModelManager._instance is None:
            ModelManager._instance = ModelManager()
        return ModelManager._instance

    def __init__(self):
        if ModelManager._instance is not None:
            raise Exception("This class is a singleton!")
        else:
            ModelManager._instance = self
        self.parametric_models = {}
        self.current_model_id = 0

    def create_new_model(self):
        self.current_model_id += 1
        self.parametric_models[self.current_model_id] = ParametricModel()
        return self.current_model_id

    def get_model(self, model_id):
        return self.parametric_models[model_id].get_model()

    def add_feature(self, model_id, feature_func, *args, **kwargs):
        return self.parametric_models[model_id].add_feature(feature_func, *args, **kwargs)

    def set_feature_visibility(self, model_id, feature_id, visible):
        self.parametric_models[model_id].set_feature_visibility(feature_id, visible)

    def set_feature_color(self, model_id, feature_id, color):
        self.parametric_models[model_id].set_feature_color(feature_id, color)

    def update_parameter(self, model_id, parameter_name, new_value):
        self.parametric_models[model_id].update_parameter(parameter_name, new_value)

    def rebuild_model(self, model_id):
        self.parametric_models[model_id].rebuild()

    def get_features(self, model_id):
        return self.parametric_models[model_id].get_features()

    def get_model_data(self, model_id):
        model = self.get_model(model_id)
        features = self.get_features(model_id)
        return {
            "id": model_id,
            "parameters": self.parametric_models[model_id].parameters,
            "features": features,
            "boundingBox": model.BoundingBox().toTuple(),
            "vertices": model.vertices().vals(),
            "faces": [
                {
                    "id": str(id(face)),
                    "type": face.type(),
                    "boundingBox": face.BoundingBox().toTuple()
                }
                for face in model.faces().vals()
            ],
            "edges": [
                {
                    "id": str(id(edge)),
                    "type": edge.type(),
                    "length": edge.Length()
                }
                for edge in model.edges().vals()
            ]
        }

    def export_model(self, model_id):
        model = self.parametric_models[model_id]
        export_data = {
            "modelId": model_id,
            "parameters": model.parameters,
            "features": []
        }

        for feature in model.features:
            export_feature = {
                "id": feature['id'],
                "type": feature['func'].__name__,
                "args": feature['args'],
                "kwargs": feature['kwargs'],
                "visible": feature['visible'],
                "color": feature['color']
            }
            export_data["features"].append(export_feature)

        return json.dumps(export_data, indent=2)

    def import_model(self, json_data):
        import_data = json.loads(json_data)
        new_model = ParametricModel()

        # Import parameters
        for name, value in import_data.get("parameters", {}).items():
            new_model.add_parameter(name, value)

        # Import features
        for feature in import_data.get("features", []):
            feature_type = feature.get("type")
            if feature_type == "circular_cut":
                feature_func = circular_cut
            elif feature_type == "concentric_extrude":
                feature_func = concentric_extrude
            elif feature_type == "mirror_feature":
                feature_func = mirror_feature
            else:
                raise ValueError(f"Unknown feature type: {feature_type}")

            args = feature.get("args", [])
            kwargs = feature.get("kwargs", {})
            
            # Add feature
            feature_id = new_model.add_feature(feature_func, *args, **kwargs)
            
            # Set visibility
            visibility = feature.get("visible", True)
            new_model.set_feature_visibility(feature_id, visibility)
            
            # Set color
            color = feature.get("color", (0.7, 0.7, 0.7))
            new_model.set_feature_color(feature_id, color)

        new_model.rebuild()
        model_id = self.create_new_model()
        self.parametric_models[model_id] = new_model
        return model_id
