# 📚 EduPortal — Student & Teacher Login System

A full-stack web application with role-based authentication for **Students** and **Teachers**, built with **Flask** (Python) backend and vanilla **HTML/CSS/JS** frontend. Uses **PostgreSQL** for storage and **JWT** for secure, stateless authentication.

---

## 🗂️ Project Structure

```
EduPortal/
│
├── Backend/
│   ├── app.py              # Main Flask application
│   ├── config.py           # DB config & secret key
│   └── requirements.txt    # Python dependencies
│
└── Frontend/
    ├── index.html          # Main HTML structure
    ├── style.css           # All styles
    └── app.js              # All JavaScript & API logic
```

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure, stateless login with access tokens
- 👥 **Role-Based Access** — Separate dashboards for Students and Teachers
- 🎓 **Student Dashboard** — View and complete academic profile (roll no., dept., year)
- 👨‍🏫 **Teacher Dashboard** — Manage subject profile & view all enrolled students
- 🔒 **Password Hashing** — Passwords secured with `bcrypt`
- 💾 **PostgreSQL** — Persistent data storage
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Backend    | Python, Flask           |
| Auth       | JWT (`flask-jwt-extended`), bcrypt |
| Database   | PostgreSQL, psycopg2    |
| Frontend   | HTML5, CSS3, JavaScript (Vanilla) |
| Fonts      | Google Fonts (Syne, DM Sans) |

---

## ⚙️ Backend Setup

### 1. Prerequisites

- Python 3.8+
- PostgreSQL installed and running

### 2. Create Virtual Environment

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install flask flask-jwt-extended psycopg2-binary bcrypt flask-cors
```

Or create a `requirements.txt`:

```
flask
flask-jwt-extended
psycopg2-binary
bcrypt
flask-cors
```

Then run:
```bash
pip install -r requirements.txt
```

### 4. Configure `config.py`

Create a `config.py` file in the `Backend/` folder:

```python
DB_CONFIG = {
    "host": "localhost",
    "database": "eduportal",       # your DB name
    "user": "postgres",            # your PostgreSQL username
    "password": "your_password"    # your PostgreSQL password
}

SECRET_KEY = "your_super_secret_key"
```

### 5. Set Up the Database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE eduportal;

\c eduportal

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher'))
);

CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    roll_number VARCHAR(50),
    department VARCHAR(100),
    year INTEGER
);

CREATE TABLE teacher_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject VARCHAR(100),
    experience_years INTEGER
);
```

> ⚠️ **Important:** Make sure the `password` column type is `VARCHAR(255)`, NOT `BYTEA`. If it was created as `BYTEA`, run:
> ```sql
> ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255) USING encode(password, 'escape');
> ```

### 6. Run the Backend

```bash
python app.py
```

The server will start at: `http://127.0.0.1:5000`

---

## 🌐 Frontend Setup

No build tools needed — just open `index.html` directly in your browser.

```
Frontend/
├── index.html
├── style.css
└── app.js
```

Make sure all 3 files are in the **same folder**.

> The API base URL is set at the top of `app.js`:
> ```js
> const API = 'http://127.0.0.1:5000';
> ```
> Change this if your Flask server runs on a different port.

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint    | Description             | Auth Required |
|--------|-------------|-------------------------|---------------|
| POST   | `/register` | Register a new user     | ❌            |
| POST   | `/login`    | Login & get JWT token   | ❌            |
| GET    | `/logout`   | Logout (clear token)    | ✅ Bearer     |

### Student

| Method | Endpoint             | Description                    | Auth Required |
|--------|----------------------|--------------------------------|---------------|
| POST   | `/student/profile`   | Create student profile         | ✅ Bearer     |
| GET    | `/student/dashboard` | Get student info & profile     | ✅ Bearer     |

### Teacher

| Method | Endpoint             | Description                        | Auth Required |
|--------|----------------------|------------------------------------|---------------|
| POST   | `/teacher/profile`   | Create teacher profile             | ✅ Bearer     |
| GET    | `/teacher/dashboard` | Get teacher info & all students    | ✅ Bearer     |

---

## 🧪 Testing with Postman

### Register
```json
POST http://127.0.0.1:5000/register
Content-Type: application/json

{
  "name": "Roshan Senaa",
  "email": "roshan@test.com",
  "password": "123456",
  "role": "student"
}
```

### Login
```json
POST http://127.0.0.1:5000/login
Content-Type: application/json

{
  "email": "roshan@test.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "role": "student",
  "access_token": "eyJhbGci..."
}
```

### Protected Routes

Add this header to all protected requests:
```
Authorization: Bearer <your_access_token>
```

In Postman: **Authorization tab → Bearer Token → paste token**

---

## 🔧 Common Issues & Fixes

### `ValueError: Invalid salt`
The password column may be `BYTEA` instead of `VARCHAR`. Fix:
```sql
ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255) USING encode(password, 'escape');
```
Then delete and re-register the user.

### CORS Error in Browser
Add Flask-CORS to your `app.py`:
```python
from flask_cors import CORS
CORS(app, supports_credentials=True)
```

### `mysql.connector.Error` in register
Replace with the correct psycopg2 exception:
```python
except psycopg2.Error as err:
    return jsonify({"error": str(err)}), 400
```

---

## 🚀 How JWT Works in This Project

```
User logs in
    ↓
Server verifies credentials
    ↓
Server returns JWT access_token
    ↓
Frontend stores token in localStorage
    ↓
Every protected request sends: Authorization: Bearer <token>
    ↓
Server validates token → grants or denies access
```

---

## 👤 Author

**Roshan Senaa S**  
Built with Flask + PostgreSQL + Vanilla JS

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
