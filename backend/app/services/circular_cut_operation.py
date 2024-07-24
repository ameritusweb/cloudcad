class ReversedCircularCutOperation:
    def __init__(self, object_id):
        self.object_id = object_id

    def apply(self, model_manager):
        # In a real system, you'd restore the cut volume here
        print(f"Reversed circular cut on object {self.object_id}")
        return model_manager.get_object(self.object_id)

class CircularCutOperation:
    def __init__(self, object_id, face_selector, circle_diameter, cut_depth):
        self.object_id = object_id
        self.face_selector = face_selector
        self.circle_diameter = circle_diameter
        self.cut_depth = cut_depth

    def apply(self, model_manager):
        return model_manager.apply_circular_cut(self.object_id, self.face_selector, self.circle_diameter, self.cut_depth)

    def reverse(self):
        # Reversing a cut is complex and might require storing the cut volume
        # For simplicity, we'll just note that this operation was reversed
        # In a real CAD system, you'd need to implement proper reversal
        return ReversedCircularCutOperation(self.object_id)