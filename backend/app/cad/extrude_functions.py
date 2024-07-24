import cadquery as cq

def create_circular_sketch_on_face(workplane, face, circle_diameter):
    # Select the face
    face_workplane = workplane.workplane(offset=0).face(face)
    
    # Create the circular sketch
    sketch = face_workplane.circle(circle_diameter / 2)
    
    return sketch

def perform_extrude_cut(workplane, sketch, cut_depth):
    # Perform the cut
    result = workplane.cut(sketch.extrude(-cut_depth))
    
    return result

def circular_cut_on_face(workplane, face_selector, circle_diameter, cut_depth):
    # Create the circular sketch
    sketch = create_circular_sketch_on_face(workplane, face_selector, circle_diameter)
    
    # Perform the cut
    result = perform_extrude_cut(workplane, sketch, cut_depth)
    
    return result

def create_concentric_circles_sketch(workplane, face, outer_diameter, inner_diameter):
    if outer_diameter <= inner_diameter:
        raise ValueError("Outer diameter must be greater than inner diameter")

    # Select the face
    face_workplane = workplane.workplane(offset=0).face(face)
    
    # Create the outer circle
    sketch = face_workplane.circle(outer_diameter / 2)
    
    # Create the inner circle
    sketch = sketch.circle(inner_diameter / 2)
    
    return sketch

def extrude_between_circles(workplane, face, outer_diameter, inner_diameter, extrude_height):
    # Create the sketch
    sketch = create_concentric_circles_sketch(workplane, face, outer_diameter, inner_diameter)
    
    # Extrude the area between circles
    result = sketch.extrude(extrude_height)
    
    return result