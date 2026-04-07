from db import db

def setup_attendance_table():
    query = """
    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT,
        status ENUM('Present', 'Absent', 'Late', 'On Leave') DEFAULT 'Present',
        date DATE DEFAULT (CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
            ON DELETE CASCADE ON UPDATE CASCADE
    )
    """
    try:
        db.execute_query(query)
        print("Attendance table checked/created successfully.")
    except Exception as e:
        print(f"Error creating attendance table: {e}")

if __name__ == "__main__":
    setup_attendance_table()
