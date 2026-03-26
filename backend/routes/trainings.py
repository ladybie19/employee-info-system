from flask import Blueprint, request, jsonify
from db import db

trainings_bp = Blueprint('trainings', __name__)


@trainings_bp.route('/trainings/<int:employee_id>', methods=['GET'])
def get_trainings(employee_id):
    trainings = db.execute_query(
        """SELECT t.training_id, t.title, t.date, t.description AS institution
           FROM trainings t
           JOIN employee_trainings et ON t.training_id = et.training_id
           WHERE et.employee_id = %s
           ORDER BY t.date DESC""",
        (employee_id,), fetch=True
    )
    for t in trainings:
        t['_id'] = t['training_id']
        if t.get('date'):
            t['date'] = str(t['date'])
    return jsonify(trainings), 200


@trainings_bp.route('/trainings', methods=['POST'])
def add_training():
    data = request.json

    # Insert training
    training_id = db.execute_query(
        "INSERT INTO trainings (title, date, description) VALUES (%s, %s, %s)",
        (data.get('title'), data.get('date'), data.get('institution', ''))
    )

    # Link to employee
    if data.get('employee_id'):
        db.execute_query(
            "INSERT INTO employee_trainings (employee_id, training_id) VALUES (%s, %s)",
            (data['employee_id'], training_id)
        )

    db.log_activity(
        data.get('employee_id'),
        f"Added training: {data.get('title')} for employee ID: {data.get('employee_id')}"
    )
    return jsonify({"message": "Training added", "id": training_id}), 201


@trainings_bp.route('/trainings/<int:id>', methods=['DELETE'])
def delete_training(id):
    # Delete from junction table first, then training
    db.execute_query("DELETE FROM employee_trainings WHERE training_id = %s", (id,))
    db.execute_query("DELETE FROM trainings WHERE training_id = %s", (id,))
    db.log_activity(None, f"Deleted training ID: {id}")
    return jsonify({"message": "Training deleted"}), 200
