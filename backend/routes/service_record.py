from flask import Blueprint, request, jsonify
from db import db

service_record_bp = Blueprint('service_record', __name__)


@service_record_bp.route('/service-records/<int:employee_id>', methods=['GET'])
def get_records(employee_id):
    records = db.execute_query(
        """SELECT service_id, employee_id, position, start_date, end_date, remarks
           FROM service_records WHERE employee_id = %s
           ORDER BY start_date DESC""",
        (employee_id,), fetch=True
    )
    for r in records:
        r['_id'] = r['service_id']
        if r.get('start_date'):
            r['start_date'] = str(r['start_date'])
        if r.get('end_date'):
            r['end_date'] = str(r['end_date'])
    return jsonify(records), 200


@service_record_bp.route('/service-records', methods=['POST'])
def add_record():
    data = request.json
    record_id = db.execute_query(
        """INSERT INTO service_records (employee_id, position, start_date, end_date, remarks) 
           VALUES (%s, %s, %s, %s, %s)""",
        (
            data.get('employee_id'),
            data.get('position'),
            data.get('start_date'),
            data.get('end_date') or None,
            data.get('remarks', '')
        )
    )

    db.log_activity(
        data.get('employee_id'),
        f"Added service record for employee ID: {data.get('employee_id')}"
    )
    return jsonify({"message": "Record added", "id": record_id}), 201


@service_record_bp.route('/service-records/<int:id>', methods=['DELETE'])
def delete_record(id):
    db.execute_query("DELETE FROM service_records WHERE service_id = %s", (id,))
    db.log_activity(None, f"Deleted service record ID: {id}")
    return jsonify({"message": "Record deleted"}), 200
