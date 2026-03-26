from flask import Flask
from flask_cors import CORS

from db import db
from routes.auth import auth_bp
from routes.employees import employees_bp
from routes.trainings import trainings_bp
from routes.service_record import service_record_bp

import os

# Serve the frontend directory as static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
# Enable CORS for frontend requests
CORS(app)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(employees_bp, url_prefix='/api')
app.register_blueprint(trainings_bp, url_prefix='/api')
app.register_blueprint(service_record_bp, url_prefix='/api')

@app.route('/')
def index():
    # Redirect root URL to the login page
    return app.send_static_file('login.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)