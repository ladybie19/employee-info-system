from flask import Blueprint, request, jsonify
from db import db
import bcrypt

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400

    # Check if username already exists
    existing = db.execute_query(
        "SELECT user_id FROM users WHERE username = %s",
        (data['username'],), fetchone=True
    )
    if existing:
        return jsonify({"error": "Username already exists"}), 400

    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

    db.execute_query(
        "INSERT INTO users (username, password) VALUES (%s, %s)",
        (data['username'], hashed.decode('utf-8'))
    )

    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400

    user = db.execute_query(
        """SELECT u.user_id, u.username, u.password, u.role, u.employee_id, e.first_name, e.last_name 
           FROM users u 
           LEFT JOIN employees e ON u.employee_id = e.employee_id 
           WHERE u.username = %s""",
        (data['username'],), fetchone=True
    )

    if user:
        # Check if role is employee - no password required for employees
        if user['role'] == 'employee':
            is_valid = True
        else:
            # Check if DB password is a bcrypt hash or plain text (from db.sql seed)
            db_password = user['password']
            if db_password.startswith('$2b$'):
                # It's a bcrypt hash
                try:
                    is_valid = bcrypt.checkpw(data.get('password', '').encode('utf-8'), db_password.encode('utf-8'))
                except ValueError:
                    is_valid = False
            else:
                # It's plain text (e.g. 'admin123')
                is_valid = (data.get('password') == db_password)
            
        if is_valid:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "username": user['username'], 
                    "id": str(user['user_id']),
                    "role": user['role'],
                    "employee_id": user['employee_id'],
                    "display_name": f"{user['first_name']} {user['last_name']}" if user['first_name'] else user['username']
                }
            }), 200

    return jsonify({"error": "Invalid credentials"}), 401
