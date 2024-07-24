import cadquery as cq

class MirrorOperation:
    def __init__(self, mirror_type, objects, mirror_plane, keep_original, align_to_axis, partial_features=None):
        self.mirror_type = mirror_type
        self.objects = objects
        self.mirror_plane = mirror_plane
        self.keep_original = keep_original
        self.align_to_axis = align_to_axis
        self.partial_features = partial_features

    def apply(self, model):
        mirrored_objects = []
        for obj in self.objects:
            if self.partial_features and obj in self.partial_features:
                mirrored = self.mirror_partial_feature(obj, self.partial_features[obj])
            else:
                mirrored = obj.mirror(self.mirror_plane.origin, self.mirror_plane.normal)
            
            if self.align_to_axis:
                mirrored = self.align_to_axis(mirrored, self.align_to_axis)
            mirrored_objects.append(mirrored)
        
        result = model
        for mirrored in mirrored_objects:
            result = result.union(mirrored)
        
        if self.keep_original:
            for obj in self.objects:
                result = result.union(obj)
        
        return result

    def mirror_partial_feature(self, obj, feature_selectors):
        # Clone the object
        cloned_obj = obj.clone()
        
        # Apply feature selectors to get the partial feature
        for selector in feature_selectors:
            cloned_obj = cloned_obj.selectors(selector)
        
        # Mirror the partial feature
        mirrored_partial = cloned_obj.mirror(self.mirror_plane.origin, self.mirror_plane.normal)
        
        # Union the mirrored partial feature with the original object
        return obj.union(mirrored_partial)

    def align_to_axis(self, obj, axis):
        if axis == 'x':
            return obj.rotateAboutCenter((0, 90, 0))
        elif axis == 'y':
            return obj.rotateAboutCenter((90, 0, 0))
        elif axis == 'z':
            return obj
        else:
            raise ValueError(f"Invalid axis: {axis}")

    def reverse(self):
        return MirrorOperation(
            self.mirror_type,
            self.objects,
            self.mirror_plane,
            not self.keep_original,
            self.align_to_axis,
            self.partial_features
        )