from flask import Flask, request, jsonify
import psycopg2
import bcrypt
from config import DB_CONFIG, SECRET_KEY
import binascii
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import json

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = SECRET_KEY

# Enable CORS (allow frontend access)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

jwt = JWTManager(app)


# ------------------ DB CONNECTION ------------------

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


# ------------------ REGISTER ------------------

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data["name"]
    email = data["email"]
    password = data["password"]
    role = data["role"]

    hashed_password = bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201

    except Exception as err:
        return jsonify({"error": str(err)}), 400

    finally:
        cursor.close()
        conn.close()


# ------------------ LOGIN ------------------

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"]
    password = data["password"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, email, password, role FROM users WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    stored_password = user[3]

    if isinstance(stored_password, str) and stored_password.startswith('\\x'):
        stored_password = binascii.unhexlify(
            stored_password[2:]
        ).decode('utf-8')

    if bcrypt.checkpw(
        password.encode('utf-8'),
        stored_password.encode('utf-8')
    ):
        identity = json.dumps({
            "user_id": user[0],
            "role": user[4]
        })

        access_token = create_access_token(identity=identity)

        return jsonify({
            "message": "Login successful",
            "role": user[4],
            "access_token": access_token
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401


# ------------------ ADD STUDENT PROFILE ------------------

@app.route("/student/profile", methods=["POST"])
@jwt_required()
def add_student_profile():
    current_user = json.loads(get_jwt_identity())

    if current_user["role"] != "student":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    roll_number = data["roll_number"]
    department = data["department"]
    year = data["year"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO student_profiles
           (user_id, roll_number, department, year)
           VALUES (%s, %s, %s, %s)""",
        (current_user["user_id"], roll_number, department, year)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Student profile created"}), 201


# ------------------ ADD TEACHER PROFILE ------------------

@app.route("/teacher/profile", methods=["POST"])
@jwt_required()
def add_teacher_profile():
    current_user = json.loads(get_jwt_identity())

    if current_user["role"] != "teacher":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    subject = data["subject"]
    experience_years = data["experience_years"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO teacher_profiles
           (user_id, subject, experience_years)
           VALUES (%s, %s, %s)""",
        (current_user["user_id"], subject, experience_years)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Teacher profile created"}), 201


# ------------------ STUDENT DASHBOARD ------------------

@app.route("/student/dashboard", methods=["GET"])
@jwt_required()
def student_dashboard():
    current_user = json.loads(get_jwt_identity())

    if current_user["role"] != "student":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, email, role FROM users WHERE id = %s",
        (current_user["user_id"],)
    )
    user = cursor.fetchone()

    cursor.execute(
        "SELECT roll_number, department, year FROM student_profiles WHERE user_id = %s",
        (current_user["user_id"],)
    )
    profile = cursor.fetchone()

    cursor.close()
    conn.close()

    if not profile:
        return jsonify({
            "name": user[1],
            "email": user[2],
            "role": user[3],
            "message": "Profile not created yet"
        }), 200

    return jsonify({
        "name": user[1],
        "email": user[2],
        "role": user[3],
        "roll_number": profile[0],
        "department": profile[1],
        "year": profile[2]
    }), 200


# ------------------ TEACHER DASHBOARD ------------------

@app.route("/teacher/dashboard", methods=["GET"])
@jwt_required()
def teacher_dashboard():
    current_user = json.loads(get_jwt_identity())

    if current_user["role"] != "teacher":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, email FROM users WHERE id = %s",
        (current_user["user_id"],)
    )
    teacher = cursor.fetchone()

    cursor.execute("""
        SELECT u.id, u.name, u.email,
               sp.roll_number, sp.department, sp.year
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student'
    """)

    students = cursor.fetchall()

    cursor.close()
    conn.close()

    student_list = [
        {
            "id": s[0],
            "name": s[1],
            "email": s[2],
            "roll_number": s[3],
            "department": s[4],
            "year": s[5]
        }
        for s in students
    ]

    return jsonify({
        "teacher_name": teacher[1],
        "teacher_email": teacher[2],
        "students": student_list
    }), 200


# ------------------ LOGOUT ------------------

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({
        "message": "Logged out successfully. Delete token on client side."
    }), 200


if __name__ == "__main__":
    app.run(debug=True)