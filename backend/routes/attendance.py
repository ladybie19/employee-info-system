from flask import Blueprint, request, jsonify
from db import db
import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    employee_id = data.get('employee_id')
    status = data.get('status')
    date = data.get('date', datetime.date.today().isoformat())
    
    # Get employee name for activity log
    emp = db.execute_query(
        "SELECT first_name, last_name FROM employees WHERE employee_id = %s",
        (employee_id,), fetchone=True
    )
    emp_name = f"{emp['first_name']} {emp['last_name']}" if emp else "Unknown"

    # Check if a record already exists
    existing = db.execute_query(
        "SELECT attendance_id FROM attendance WHERE employee_id = %s AND date = %s",
        (employee_id, date),
        fetchone=True
    )
    
    if existing:
        # If updating status, or if updating times
        set_parts = []
        params = []
        if status:
            set_parts.append("status = %s")
            params.append(status)
        if data.get('time_in'):
            set_parts.append("time_in = %s")
            params.append(data.get('time_in'))
        if data.get('time_out'):
            set_parts.append("time_out = %s")
            params.append(data.get('time_out'))
        
        if not set_parts:
            return jsonify({"message": "No data to update"}), 400

        query = f"UPDATE attendance SET {', '.join(set_parts)} WHERE attendance_id = %s"
        params.append(existing['attendance_id'])
        db.execute_query(query, tuple(params))
        message = f"Updated attendance for {emp_name}"
    else:
        query = "INSERT INTO attendance (employee_id, status, date, time_in, time_out) VALUES (%s, %s, %s, %s, %s)"
        db.execute_query(query, (
            employee_id, 
            status or 'Present', 
            date, 
            data.get('time_in'), 
            data.get('time_out')
        ))
        message = f"Marked {emp_name} as {status or 'Present'}"
        
    db.log_activity(employee_id, f"Attendance activity for {emp_name}")
    
    return jsonify({"message": message}), 200

@attendance_bp.route('/attendance/today', methods=['GET'])
def get_today_attendance():
    today = datetime.date.today().isoformat()
    query = """
        SELECT a.employee_id, a.status, a.time_in, a.time_out, e.first_name, e.last_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        WHERE a.date = %s
    """
    attendance = db.execute_query(query, (today,), fetch=True)
    for att in attendance:
        if att.get('time_in'): att['time_in'] = str(att['time_in'])
        if att.get('time_out'): att['time_out'] = str(att['time_out'])
    return jsonify(attendance), 200

@attendance_bp.route('/attendance/trends', methods=['GET'])
def get_attendance_trends():
    query = """
    SELECT date, 
           SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
           SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
           SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
           SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
    FROM attendance 
    GROUP BY date 
    ORDER BY date ASC 
    LIMIT 30
    """
    trends = db.execute_query(query, fetch=True)
    # Convert date objects to strings
    for t in trends:
        if t.get('date'):
            t['date'] = str(t['date'])
    return jsonify(trends), 200

@attendance_bp.route('/attendance/employee/<int:id>', methods=['GET'])
def get_employee_attendance(id):
    query = """
        SELECT attendance_id, status, date, time_in, time_out, created_at 
        FROM attendance 
        WHERE employee_id = %s 
        ORDER BY date DESC
    """
    attendance = db.execute_query(query, (id,), fetch=True)
    # Convert dates and times to strings
    for entry in attendance:
        if entry.get('date'):
            entry['date'] = str(entry['date'])
        if entry.get('time_in'):
            entry['time_in'] = str(entry['time_in'])
        if entry.get('time_out'):
            entry['time_out'] = str(entry['time_out'])
        if entry.get('created_at'):
            entry['created_at'] = entry['created_at'].isoformat()
    return jsonify(attendance), 200
