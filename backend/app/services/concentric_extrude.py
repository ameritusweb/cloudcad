class ConcentricExtrudeOperation:
    def __init__(self, object_id, face_selector, outer_diameter, inner_diameter, extrude_height):
        self.object_id = object_id
        self.face_selector = face_selector
        self.outer_diameter = outer_diameter
        self.inner_diameter = inner_diameter
        self.extrude_height = extrude_height

    def apply(self, model_manager):
        return model_manager.apply_concentric_extrude(
            self.object_id, self.face_selector, self.outer_diameter, self.inner_diameter, self.extrude_height
        )

    def reverse(self):
        # Reversing an extrude operation would require cutting the extruded volume
        # For simplicity, we'll just note that this operation was reversed
        # In a real CAD system, you'd need to implement proper reversal
        return ReversedConcentricExtrudeOperation(self.object_id)

class ReversedConcentricExtrudeOperation:
    def __init__(self, object_id):
        self.object_id = object_id

    def apply(self, model_manager):
        # In a real system, you'd remove the extruded volume here
        print(f"Reversed concentric extrude on object {self.object_id}")
        return model_manager.get_object(self.object_id)