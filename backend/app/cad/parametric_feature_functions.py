import cadquery as cq

def create_cylinder(workplane, radius, height):
    return workplane.cylinder(height, radius)

def circular_cut(workplane, radius, depth):
    return workplane.faces(">Z").circle(radius).cutBlind(-depth)

def concentric_extrude(workplane, outer_radius, inner_radius, height):
    return workplane.faces(">Z").circle(outer_radius).circle(inner_radius).extrude(height)

def mirror_feature(workplane, mirror_plane):
    return workplane.mirror(mirror_plane.origin, mirror_plane.normal)

# Add more parametric feature functions as needed