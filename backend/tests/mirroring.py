import unittest
from .model_manager import ModelManager
from .advanced_mirroring_logic import MirrorOperation, MirrorOperationError
import cadquery as cq

class TestMirroringFunctionality(unittest.TestCase):
    def setUp(self):
        self.model_manager = ModelManager.get_instance()
        self.model_manager.model = cq.Workplane('XY').box(1, 1, 1)

    def test_simple_mirror(self):
        mirror_plane = cq.Plane.XY
        mirror_op = MirrorOperation('body', [self.model_manager.model], mirror_plane, True, None, None)
        result = mirror_op.apply(self.model_manager.model)
        self.assertEqual(len(result.solids().vals()), 2)

    def test_partial_mirror(self):
        box = cq.Workplane('XY').box(1, 1, 1).faces(">Z").circle(0.2).extrude(0.5)
        self.model_manager.model = box
        mirror_plane = cq.Plane.XY
        partial_features = {id(box): ['faces(">Z")']}
        mirror_op = MirrorOperation('feature', [box], mirror_plane, True, None, partial_features)
        result = mirror_op.apply(self.model_manager.model)
        self.assertEqual(len(result.faces().vals()), 10)  # Original 6 faces + 4 new faces from partial mirror

    def test_invalid_mirror(self):
        mirror_plane = cq.Plane.XY.move(cq.Vector(0.5, 0.5, 0.5))
        with self.assertRaises(MirrorOperationError):
            mirror_op = MirrorOperation('body', [self.model_manager.model], mirror_plane, True, None, None)
            mirror_op.apply(self.model_manager.model)

    def test_undo_redo(self):
        initial_solid_count = len(self.model_manager.model.solids().vals())
        mirror_plane = cq.Plane.XY
        mirror_op = MirrorOperation('body', [self.model_manager.model], mirror_plane, True, None, None)
        self.model_manager.apply_mirror_operation(mirror_op)
        self.assertEqual(len(self.model_manager.model.solids().vals()), initial_solid_count * 2)
        
        self.model_manager.undo()
        self.assertEqual(len(self.model_manager.model.solids().vals()), initial_solid_count)
        
        self.model_manager.redo()
        self.assertEqual(len(self.model_manager.model.solids().vals()), initial_solid_count * 2)

if __name__ == '__main__':
    unittest.main()