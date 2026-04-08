from flask import Blueprint, request, jsonify
from db import db

employees_bp = Blueprint('employees', __name__)


@employees_bp.route('/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    summary = db.execute_query(
        "SELECT * FROM dashboard_summary", fetch=True
    )
    stats = summary[0] if summary else {
        "total_employees": 0, "permanent": 0, "temporary": 0, "separated": 0
    }

    activities = db.execute_query(
        """SELECT a.activity_id, a.employee_id, a.activity, a.created_at, e.first_name, e.last_name 
           FROM activities a 
           LEFT JOIN employees e ON a.employee_id = e.employee_id 
           ORDER BY a.created_at DESC LIMIT 10""",
        fetch=True
    )
    for act in activities:
        if act.get('created_at'):
            act['timestamp'] = act['created_at'].isoformat()
        else:
            act['timestamp'] = None
        act['action'] = act.get('activity', '')
        
        if act.get('first_name'):
            act['details'] = f"{act['first_name']} {act['last_name']} (ID: {act['employee_id']})"
        else:
            act['details'] = f"System / Unknown (ID: {act.get('employee_id') if act.get('employee_id') is not None else 'N/A'})"

    return jsonify({
        "summary": {
            "total": int(stats.get("total_employees") or 0),
            "permanent": int(stats.get("permanent") or 0),
            "temporary": int(stats.get("temporary") or 0),
            "separated": int(stats.get("separated") or 0)
        },
        "activities": activities
    }), 200


@employees_bp.route('/employees', methods=['GET'])
def get_employees():
    employees = db.execute_query(
        """SELECT employee_id, first_name, last_name, birthday, status, position, date_hired, created_at 
           FROM employees ORDER BY employee_id DESC""",
        fetch=True
    )
    # Convert date objects to strings for JSON serialization
    for emp in employees:
        emp['_id'] = emp['employee_id']
        if emp.get('birthday'):
            emp['birthday'] = str(emp['birthday'])
        if emp.get('date_hired'):
            emp['date_hired'] = str(emp['date_hired'])
        if emp.get('created_at'):
            emp['created_at'] = emp['created_at'].isoformat()
    return jsonify(employees), 200


@employees_bp.route('/employees', methods=['POST'])
def add_employee():
    data = request.json
    query = """INSERT INTO employees (first_name, last_name, birthday, status, position, date_hired) 
               VALUES (%s, %s, %s, %s, %s, %s)"""
    params = (
        data.get('first_name'),
        data.get('last_name'),
        data.get('birthday'),
        data.get('status', 'Temporary'),
        data.get('position'),
        data.get('date_hired')
    )
    employee_id = db.execute_query(query, params)

    # Automatically create user account for the employee
    first_name = data.get('first_name', '').lower().replace(' ', '')
    if first_name:
        # Check if username exists, if so add ID to make it unique
        existing = db.execute_query("SELECT user_id FROM users WHERE username = %s", (first_name,), fetchone=True)
        username = first_name if not existing else f"{first_name}{employee_id}"
        
        db.execute_query(
            "INSERT INTO users (username, password, role, employee_id) VALUES (%s, %s, %s, %s)",
            (username, 'password123', 'employee', employee_id)
        )

    db.log_activity(employee_id, f"Added employee: {data.get('first_name')} {data.get('last_name')}")

    return jsonify({"message": "Employee added successfully", "id": employee_id}), 201


@employees_bp.route('/employees/<int:id>', methods=['GET'])
def get_employee(id):
    emp = db.execute_query(
        "SELECT * FROM employees WHERE employee_id = %s",
        (id,), fetchone=True
    )
    if emp:
        emp['_id'] = emp['employee_id']
        if emp.get('birthday'):
            emp['birthday'] = str(emp['birthday'])
        if emp.get('date_hired'):
            emp['date_hired'] = str(emp['date_hired'])
        if emp.get('created_at'):
            emp['created_at'] = emp['created_at'].isoformat()
        return jsonify(emp), 200
    
    return jsonify({"error": f"Employee with ID {id} not found in database."}), 404


@employees_bp.route('/employees/<int:id>', methods=['PUT'])
def update_employee(id):
    data = request.json
    query = """UPDATE employees 
               SET first_name = %s, last_name = %s, birthday = %s, status = %s, position = %s, date_hired = %s 
               WHERE employee_id = %s"""
    params = (
        data.get('first_name'),
        data.get('last_name'),
        data.get('birthday'),
        data.get('status'),
        data.get('position'),
        data.get('date_hired'),
        id
    )
    db.execute_query(query, params)

    # Update username if first name changed
    first_name = data.get('first_name', '').lower().replace(' ', '')
    if first_name:
        db.execute_query(
            "UPDATE users SET username = %s WHERE employee_id = %s",
            (first_name, id)
        )

    db.log_activity(id, f"Updated employee: {data.get('first_name')} {data.get('last_name')}")
    return jsonify({"message": "Employee updated"}), 200


@employees_bp.route('/employees/<int:id>', methods=['DELETE'])
def delete_employee(id):
    # Get name before deleting
    emp = db.execute_query(
        "SELECT first_name, last_name FROM employees WHERE employee_id = %s",
        (id,), fetchone=True
    )
    name = f"{emp['first_name']} {emp['last_name']}" if emp else "Unknown"

    db.execute_query("DELETE FROM employees WHERE employee_id = %s", (id,))
    db.log_activity(None, f"Deleted employee: {name}")
    return jsonify({"message": "Employee deleted"}), 200
