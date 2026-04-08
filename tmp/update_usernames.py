from backend.db import db

def update_usernames():
    try:
        # Get all employees
        employees = db.execute_query("SELECT employee_id, first_name FROM employees", fetch=True)
        
        for emp in employees:
            emp_id = emp['employee_id']
            firstname = emp['first_name'].lower().replace(' ', '')
            
            # Check if user exists for this employee
            user = db.execute_query("SELECT user_id FROM users WHERE employee_id = %s", (emp_id,), fetchone=True)
            
            if user:
                print(f"Updating username for employee {emp_id} ({emp['first_name']}) to {firstname}")
                db.execute_query("UPDATE users SET username = %s WHERE employee_id = %s", (firstname, emp_id))
            else:
                print(f"Creating user account for employee {emp_id} ({emp['first_name']}) with username {firstname}")
                # default password: password123
                db.execute_query("INSERT INTO users (username, password, role, employee_id) VALUES (%s, %s, %s, %s)", 
                                (firstname, 'password123', 'employee', emp_id))

        print("Updating admin account...")
        # Ensure admin is still admin
        db.execute_query("UPDATE users SET role = 'admin' WHERE username = 'admin'")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_usernames()
