from flask import Flask, jsonify
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "supports_credentials": True}})
        
    # Import the routes blueprint from the submodule
    from .routes.cad_operations import cad_operations as cad_operations_blueprint  # Note the dot notation
    app.register_blueprint(cad_operations_blueprint, url_prefix='/api')

    # Import and register blueprints
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app