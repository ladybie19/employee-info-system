import sys
import os

# Add the backend directory to the system path so internal imports work seamlessly
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, backend_path)

from backend.app import app

if __name__ == '__main__':
    app.run(debug=True, port=5000)
