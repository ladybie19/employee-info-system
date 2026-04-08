from backend.db import db
import json

def test_fetch():
    id = 3
    print(f"Attempting to fetch employee with ID {id}...")
    emp = db.execute_query(
        "SELECT * FROM employees WHERE employee_id = %s",
        (id,), fetchone=True
    )
    print(f"Result: {emp}")
    
    if emp:
        # Check types
        for k, v in emp.items():
            print(f"{k}: {type(v)}")

if __name__ == "__main__":
    test_fetch()
