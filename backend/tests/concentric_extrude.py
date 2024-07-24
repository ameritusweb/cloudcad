import unittest
from .model_manager import ModelManager
from .concentric_extrude_operations import extrude_between_circles
import cadquery as cq

class TestConcentricExtrudeFunctionality(unittest.TestCase):
    def setUp(self):
        self.model_manager = ModelManager.get_instance()
        self.model_manager.model = cq.Workplane('XY').cylinder(10, 20)  # Create a simple cylinder

    def test_concentric_extrude(self):
        result = extrude_between_circles(self.model_manager.model, ">Z", 8, 4, 2)
        self.assertEqual(len(result.faces().vals()), 8)  # Original 3 faces + 5 new faces from extrude

    def test_concentric_extrude_invalid_diameters(self):
        with self.assertRaises(ValueError):
            extrude_between_circles(self.model_manager.model, ">Z", 4, 8, 2)  # Inner diameter larger than outer

    def test_concentric_extrude_invalid_face(self):
        with self.assertRaises(ValueError):
            extrude_between_circles(self.model_manager.model, "invalid_selector", 8, 4, 2)

    def test_model_manager_concentric_extrude(self):
        object_id = id(self.model_manager.model)
        updated_model_data = self.model_manager.apply_concentric_extrude(object_id, ">Z", 8, 4, 2)
        self.assertIn('objects', updated_model_data)
        self.assertEqual(len(updated_model_data['objects']), 1)
        self.assertEqual(len(updated_model_data['objects'][0]['faces']), 8)

if __name__ == '__main__':
    unittest.main()
	