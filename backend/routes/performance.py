from flask import Blueprint, request, jsonify
from db import db
from decimal import Decimal

performance_bp = Blueprint('performance', __name__)


def convert_decimal(obj):
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


@performance_bp.route('/performance', methods=['GET'])
def get_all_performance():
    """Get all performance ratings with employee names."""
    ratings = db.execute_query(
        """SELECT pr.rating_id, pr.employee_id, pr.rating, pr.quarter, pr.year, pr.remarks,
                  e.first_name, e.last_name
           FROM performance_ratings pr
           JOIN employees e ON pr.employee_id = e.employee_id
           ORDER BY pr.year DESC, pr.quarter DESC""",
        fetch=True
    )
    for r in ratings:
        r['rating'] = float(r['rating']) if isinstance(r['rating'], Decimal) else r['rating']
        if r.get('created_at'):
            r['created_at'] = r['created_at'].isoformat()
    return jsonify(ratings), 200


@performance_bp.route('/performance', methods=['POST'])
def add_performance():
    """Add a new performance rating."""
    data = request.json
    employee_id = data.get('employee_id')
    rating = data.get('rating')
    quarter = data.get('quarter')
    year = data.get('year')
    remarks = data.get('remarks', '')

    if not all([employee_id, rating, quarter, year]):
        return jsonify({"error": "employee_id, rating, quarter, and year are required"}), 400

    try:
        rating_id = db.execute_query(
            """INSERT INTO performance_ratings (employee_id, rating, quarter, year, remarks)
               VALUES (%s, %s, %s, %s, %s)""",
            (employee_id, rating, quarter, year, remarks)
        )
        # Get employee name for activity log
        emp = db.execute_query(
            "SELECT first_name, last_name FROM employees WHERE employee_id = %s",
            (employee_id,), fetchone=True
        )
        name = f"{emp['first_name']} {emp['last_name']}" if emp else "Unknown"
        db.log_activity(employee_id, f"Added performance rating ({rating}/5) for {name} - {quarter} {year}")

        return jsonify({"message": "Performance rating added", "id": rating_id}), 201
    except Exception as e:
        if "Duplicate" in str(e):
            return jsonify({"error": f"Rating already exists for this employee in {quarter} {year}"}), 409
        raise


@performance_bp.route('/performance/<int:id>', methods=['PUT'])
def update_performance(id):
    """Update a performance rating."""
    data = request.json
    db.execute_query(
        """UPDATE performance_ratings 
           SET rating = %s, quarter = %s, year = %s, remarks = %s
           WHERE rating_id = %s""",
        (data.get('rating'), data.get('quarter'), data.get('year'), data.get('remarks', ''), id)
    )
    return jsonify({"message": "Performance rating updated"}), 200


@performance_bp.route('/performance/<int:id>', methods=['DELETE'])
def delete_performance(id):
    """Delete a performance rating."""
    db.execute_query("DELETE FROM performance_ratings WHERE rating_id = %s", (id,))
    return jsonify({"message": "Performance rating deleted"}), 200


@performance_bp.route('/performance/chart-data', methods=['GET'])
def get_chart_data():
    """Get aggregated performance data for charts."""
    year = request.args.get('year', 2025, type=int)

    # 1. Average rating per quarter (line/bar chart)
    quarterly_avg = db.execute_query(
        """SELECT quarter, ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as count
           FROM performance_ratings
           WHERE year = %s
           GROUP BY quarter
           ORDER BY FIELD(quarter, 'Q1', 'Q2', 'Q3', 'Q4')""",
        (year,), fetch=True
    )
    for q in quarterly_avg:
        q['avg_rating'] = float(q['avg_rating']) if isinstance(q['avg_rating'], Decimal) else q['avg_rating']

    # 2. Per-employee trend (line chart - each employee as a line)
    employee_trends = db.execute_query(
        """SELECT pr.employee_id, e.first_name, e.last_name, pr.quarter, pr.rating
           FROM performance_ratings pr
           JOIN employees e ON pr.employee_id = e.employee_id
           WHERE pr.year = %s
           ORDER BY pr.employee_id, FIELD(pr.quarter, 'Q1', 'Q2', 'Q3', 'Q4')""",
        (year,), fetch=True
    )
    # Group by employee
    emp_data = {}
    for row in employee_trends:
        eid = row['employee_id']
        if eid not in emp_data:
            emp_data[eid] = {
                'name': f"{row['first_name']} {row['last_name']}",
                'ratings': {}
            }
        rating_val = float(row['rating']) if isinstance(row['rating'], Decimal) else row['rating']
        emp_data[eid]['ratings'][row['quarter']] = rating_val

    # 3. Rating distribution (doughnut chart)
    distribution = db.execute_query(
        """SELECT 
             SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as outstanding,
             SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as good,
             SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as average,
             SUM(CASE WHEN rating < 2.5 THEN 1 ELSE 0 END) as needs_improvement
           FROM performance_ratings
           WHERE year = %s""",
        (year,), fetchone=True
    )
    if distribution:
        for key in distribution:
            distribution[key] = int(distribution[key] or 0)

    # 4. Available years for filter
    years = db.execute_query(
        "SELECT DISTINCT year FROM performance_ratings ORDER BY year DESC",
        fetch=True
    )

    return jsonify({
        "quarterly_avg": quarterly_avg,
        "employee_trends": emp_data,
        "distribution": distribution or {"outstanding": 0, "good": 0, "average": 0, "needs_improvement": 0},
        "available_years": [y['year'] for y in years]
    }), 200
