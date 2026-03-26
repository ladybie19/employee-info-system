import pymysql
import pymysql.cursors
import datetime


class Database:
    def __init__(self):
        self.config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'employee_system',
            'cursorclass': pymysql.cursors.DictCursor
        }

    def get_connection(self):
        """Get a new database connection."""
        try:
            conn = pymysql.connect(**self.config)
            return conn
        except Exception as e:
            print(f"Database connection error: {e}")
            raise

    def execute_query(self, query, params=None, fetch=False, fetchone=False):
        """Execute a query and optionally fetch results."""
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                if fetch:
                    return cursor.fetchall()
                elif fetchone:
                    return cursor.fetchone()
                else:
                    conn.commit()
                    return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"Query error: {e}")
            raise
        finally:
            conn.close()

    def log_activity(self, employee_id, activity):
        """Log an activity to the activities table."""
        query = "INSERT INTO activities (employee_id, activity) VALUES (%s, %s)"
        self.execute_query(query, (employee_id, activity))


db = Database()