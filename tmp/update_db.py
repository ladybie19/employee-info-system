from backend.db import db

def update_schema():
    try:
        # Add employee_id column if it doesn't exist
        # Check if column exists first
        columns = db.execute_query("SHOW COLUMNS FROM users", fetch=True)
        column_names = [c['Field'] for c in columns]
        
        if 'employee_id' not in column_names:
            print("Adding employee_id column to users table...")
            db.execute_query("ALTER TABLE users ADD COLUMN employee_id INT NULL")
            db.execute_query("ALTER TABLE users ADD FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL")
            print("Column added successfully.")
        else:
            print("employee_id column already exists.")

        # Update sample users
        # Link 'staff1' to Maria Santos (employee_id 2 in db.sql)
        print("Linking staff1 to employee_id 2...")
        db.execute_query("UPDATE users SET role = 'employee', employee_id = 2 WHERE username = 'staff1'")
        
        # Link 'admin' to Juan Dela Cruz (employee_id 1 in db.sql)
        # Admins don't strictly need employee_id but it's okay for testing
        print("Linking admin to employee_id 1...")
        db.execute_query("UPDATE users SET role = 'admin', employee_id = 1 WHERE username = 'admin'")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_schema()
