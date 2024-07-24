from flask import Blueprint

main = Blueprint('main', __name__)

@main.route('/api/test')
def test():
    return {'message': 'Test route is working!'}