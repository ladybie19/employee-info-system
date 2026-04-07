-- =====================================
-- CREATE DATABASE
-- =====================================
CREATE DATABASE IF NOT EXISTS employee_system;
USE employee_system;

-- =====================================
-- USERS (LOGIN)
-- =====================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- EMPLOYEES
-- =====================================
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birthday DATE,
    status ENUM('Permanent','Temporary','Separated') DEFAULT 'Temporary',
    position VARCHAR(100),
    date_hired DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- SERVICE RECORDS
-- =====================================
CREATE TABLE service_records (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    position VARCHAR(100),
    start_date DATE,
    end_date DATE,
    remarks VARCHAR(255),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================
-- TRAININGS
-- =====================================
CREATE TABLE trainings (
    training_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    date DATE,
    description TEXT
);

-- =====================================
-- EMPLOYEE TRAININGS (MANY-TO-MANY)
-- =====================================
CREATE TABLE employee_trainings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    training_id INT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(training_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================
-- ACTIVITIES (RECENT LOGS)
-- =====================================
CREATE TABLE activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NULL,
    activity TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================
-- ATTENDANCE
-- =====================================
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    status ENUM('Present', 'Absent', 'Late', 'On Leave') DEFAULT 'Present',
    date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================
-- DASHBOARD VIEW
-- =====================================
CREATE VIEW dashboard_summary AS
SELECT 
    COUNT(*) AS total_employees,
    SUM(CASE WHEN status = 'Permanent' THEN 1 ELSE 0 END) AS permanent,
    SUM(CASE WHEN status = 'Temporary' THEN 1 ELSE 0 END) AS temporary,
    SUM(CASE WHEN status = 'Separated' THEN 1 ELSE 0 END) AS separated
FROM employees;

-- =====================================
-- SAMPLE DATA
-- =====================================

-- USERS
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('staff1', 'staff123', 'staff');

-- EMPLOYEES
INSERT INTO employees (first_name, last_name, birthday, status, position, date_hired) VALUES
('Juan', 'Dela Cruz', '1995-05-10', 'Permanent', 'Manager', '2020-01-15'),
('Maria', 'Santos', '1998-08-21', 'Temporary', 'Assistant', '2023-03-01'),
('Pedro', 'Reyes', '1990-02-11', 'Separated', 'Clerk', '2018-07-10');

-- SERVICE RECORDS
INSERT INTO service_records (employee_id, position, start_date, end_date, remarks) VALUES
(1, 'Assistant Manager', '2020-01-15', '2022-01-01', 'Promoted'),
(1, 'Manager', '2022-01-02', NULL, 'Current'),
(2, 'Assistant', '2023-03-01', NULL, 'Active');

-- TRAININGS
INSERT INTO trainings (title, date, description) VALUES
('Leadership Training', '2024-06-01', 'Leadership skills development'),
('Safety Training', '2024-07-15', 'Workplace safety');

-- EMPLOYEE TRAININGS
INSERT INTO employee_trainings (employee_id, training_id) VALUES
(1, 1),
(2, 2);

-- ACTIVITIES
INSERT INTO activities (employee_id, activity) VALUES
(1, 'Logged in'),
(2, 'Added new employee record'),
(1, 'Updated service record');

-- =====================================
-- TEST QUERY
-- =====================================
SELECT * FROM dashboard_summary;