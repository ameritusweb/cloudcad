from flask import Blueprint

main = Blueprint('main', __name__)

@main.route('/api/test')
def test():
    return {'message': 'Test route is working!'}

# Import other route files here
# from . import cad_operations, structural_analysis, etc.