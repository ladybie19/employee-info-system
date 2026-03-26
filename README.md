# Employee Information System

This is a complete Employee Information System built with Flask, MongoDB, and Vanilla JS/HTML/CSS.

## Project Structure
- `backend/` - Flask API and MongoDB PyMongo connection logic
- `frontend/` - Static HTML, CSS, and JS files with a premium dark theme
- `requirements.txt` - Python dependencies

## Prerequisites
1. Python 3.8+
2. MongoDB installed locally and running on default port `27017`

## Setup & Running

### 1. Backend Setup
Open a terminal in the root directory (`employee-info-system`) and run:
```bash
# Install dependencies
pip install -r requirements.txt

# Start the Flask API
python -m backend.app
```
The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
You can run the frontend using any local development server.
Open another terminal in the root directory and run:
```bash
cd frontend
python -m http.server 8000
```
Then, open your browser and navigate to `http://localhost:8000/login.html`.

## Features
- **Authentication**: Register and login interface
- **Dashboard**: Summary statistics and recent activity logs
- **Employee Management**: CRUD operations to manage employee status, info, and hiring data
- **Trainings Module**: Track individual training history per employee
- **Service Records Module**: Track job positioning history per employee

## Technologies Used
- **Backend**: Flask, Flask-CORS, PyMongo, bcrypt
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Fetch API)
- **Database**: MongoDB