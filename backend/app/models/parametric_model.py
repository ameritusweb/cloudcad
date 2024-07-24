import cadquery as cq

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