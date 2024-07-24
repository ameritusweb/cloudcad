import unittest
from .model_manager import ModelManager
from .circular_cut_operations import circular_cut_on_face
import cadquery as cq

class TestCircularCutFunctionality(unittest.TestCase):
    def setUp(self):
        self.model_manager = ModelManager.get_instance()
        self.model_manager.model = cq.Workplane('XY').cylinder(10, 20)  # Create a simple cylinder

    def test_circular_cut(self):
        result = circular_cut_on_face(self.model_manager.model, ">Z", 5, 2)
        self.assertEqual(len(result.faces().vals()), 5)  # Original 3 faces + 2 new faces from cut

    def test_circular_cut_too_deep(self):
        with self.assertRaises(ValueError):
            circular_cut_on_face(self.model_manager.model, ">Z", 5, 25)  # Cut deeper than cylinder height

    def test_circular_cut_invalid_face(self):
        with self.assertRaises(ValueError):
            circular_cut_on_face(self.model_manager.model, "invalid_selector", 5, 2)

    def test_model_manager_circular_cut(self):
        object_id = id(self.model_manager.model)
        updated_model_data = self.model_manager.apply_circular_cut(object_id, ">Z", 5, 2)
        self.assertIn('objects', updated_model_data)
        self.assertEqual(len(updated_model_data['objects']), 1)
        self.assertEqual(len(updated_model_data['objects'][0]['faces']), 5)

if __name__ == '__main__':
    unittest.main()