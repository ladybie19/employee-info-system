from flask import Flask, request, jsonify
from db import get_db_connection
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# =====================================
# LOGIN
# =====================================
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
    user = cursor.fetchone()

    if user and user['password'] == password:
        return jsonify({"message": "Login successful", "user": user})
    else:
        return jsonify({"message": "Invalid credentials"}), 401


# =====================================
# DASHBOARD (VIEW)
# =====================================
@app.route('/dashboard', methods=['GET'])
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM dashboard_summary")
    data = cursor.fetchone()

    return jsonify(data)


# =====================================
# GET EMPLOYEES
# =====================================
@app.route('/employees', methods=['GET'])
def get_employees():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM employees")
    data = cursor.fetchall()

    return jsonify(data)


# =====================================
# ADD EMPLOYEE
# =====================================
@app.route('/employees', methods=['POST'])
def add_employee():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """INSERT INTO employees
    (first_name, last_name, birthday, status, position, date_hired)
    VALUES (%s, %s, %s, %s, %s, %s)"""

    values = (
        data['first_name'],
        data['last_name'],
        data['birthday'],
        data['status'],
        data['position'],
        data['date_hired']
    )

    cursor.execute(sql, values)
    conn.commit()

    return jsonify({"message": "Employee added"})


# =====================================
# UPDATE EMPLOYEE
# =====================================
@app.route('/employees/<int:id>', methods=['PUT'])
def update_employee(id):
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """UPDATE employees SET
    first_name=%s, last_name=%s, birthday=%s,
    status=%s, position=%s, date_hired=%s
    WHERE employee_id=%s"""

    values = (
        data['first_name'],
        data['last_name'],
        data['birthday'],
        data['status'],
        data['position'],
        data['date_hired'],
        id
    )

    cursor.execute(sql, values)
    conn.commit()

    return jsonify({"message": "Employee updated"})


# =====================================
# DELETE EMPLOYEE
# =====================================
@app.route('/employees/<int:id>', methods=['DELETE'])
def delete_employee(id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM employees WHERE employee_id=%s", (id,))
    conn.commit()

    return jsonify({"message": "Employee deleted"})


# =====================================
# SERVICE RECORDS
# =====================================
@app.route('/service', methods=['POST'])
def add_service():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """INSERT INTO service_records
    (employee_id, position, start_date, end_date, remarks)
    VALUES (%s, %s, %s, %s, %s)"""

    values = (
        data['employee_id'],
        data['position'],
        data['start_date'],
        data['end_date'],
        data['remarks']
    )

    cursor.execute(sql, values)
    conn.commit()

    return jsonify({"message": "Service record added"})


# =====================================
# TRAININGS
# =====================================
@app.route('/trainings', methods=['POST'])
def add_training():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO trainings (title, date, description) VALUES (%s, %s, %s)",
        (data['title'], data['date'], data['description'])
    )
    conn.commit()

    return jsonify({"message": "Training added"})


# =====================================
# ASSIGN TRAINING
# =====================================
@app.route('/assign-training', methods=['POST'])
def assign_training():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO employee_trainings (employee_id, training_id) VALUES (%s, %s)",
        (data['employee_id'], data['training_id'])
    )
    conn.commit()

    return jsonify({"message": "Training assigned"})


# =====================================
# ACTIVITIES
# =====================================
@app.route('/activities', methods=['GET'])
def activities():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM activities ORDER BY created_at DESC")
    data = cursor.fetchall()

    return jsonify(data)


# =====================================
# RUN SERVER
# =====================================
if __name__ == '__main__':
    app.run(debug=True)