import cadquery as cq
import numpy as np

def mirror_feature(workplane, feature, mirror_plane):
    # Assume feature is a CadQuery object
    mirrored = feature.mirror(mirror_plane.origin, mirror_plane.normal)
    return workplane.union(mirrored)

def mirror_body(workplane, body, mirror_plane):
    # Assume body is a CadQuery Workplane object
    mirrored = body.mirror(mirror_plane.origin, mirror_plane.normal)
    return workplane.union(mirrored)

def mirror_sketch(sketch, mirror_line):
    # Assume sketch is a list of points
    mirrored_points = []
    for point in sketch:
        mirrored_point = mirror_point(point, mirror_line)
        mirrored_points.append(mirrored_point)
    return mirrored_points

def mirror_point(point, mirror_line):
    # Mirror a point across a line
    x1, y1 = mirror_line[0]
    x2, y2 = mirror_line[1]
    x, y = point

    dx = x2 - x1
    dy = y2 - y1

    a = (dx * dx - dy * dy) / (dx * dx + dy * dy)
    b = 2 * dx * dy / (dx * dx + dy * dy)

    x_new = a * (x - x1) + b * (y - y1) + x1
    y_new = b * (x - x1) - a * (y - y1) + y1

    return (x_new, y_new)

def create_mirror_plane(origin, normal):
    return cq.Plane(origin, normal)

def apply_mirror_operation(model, mirror_type, object_to_mirror, mirror_plane):
    if mirror_type == 'feature':
        return mirror_feature(model, object_to_mirror, mirror_plane)
    elif mirror_type == 'body':
        return mirror_body(model, object_to_mirror, mirror_plane)
    elif mirror_type == 'sketch':
        mirror_line = (mirror_plane.origin[:2], (mirror_plane.origin + mirror_plane.normal)[:2])
        return mirror_sketch(object_to_mirror, mirror_line)
    else:
        raise ValueError(f"Unknown mirror type: {mirror_type}")