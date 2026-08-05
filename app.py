from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mysql.connector
import os
import requests

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("MYSQL_HOST"),
        user=os.environ.get("MYSQL_USER"),
        password=os.environ.get("MYSQL_PASSWORD"),
        database=os.environ.get("MYSQL_DATABASE"),
        port=int(os.environ.get("MYSQL_PORT", 3306))
    )

def init_db():
    try:
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        db.commit()
        cursor.close()
        db.close()
        print("Table 'contacts' checked/created successfully!")
    except Exception as e:
        print(f"Error creating table: {e}")

# Initialize database table
init_db()

# Helper function email bhejne ke liye (Alag-alag recipient support ke saath)
def send_email_notification(subject, body, receiver_email):
    api_key = os.environ.get("EMAIL_API_KEY")
    
    if not api_key:
        print("Email API Key missing. Skipping email notification.")
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": "onboarding@resend.dev",
        "to": [receiver_email],
        "subject": subject,
        "text": body
    }
    try:
        response = requests.post("https://api.resend.com/emails", json=payload, headers=headers)
        print("Email response:", response.text)
    except Exception as e:
        print(f"Failed to send email: {e}")

# Open Website
@app.route("/")
def home():
    return send_file("index.html")

# Contact Form API (Data goes to shreebhargavainfra@gmail.com)
@app.route("/contact", methods=["POST"])
def contact():
    data = request.form if request.form else (request.json or {})

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone", "")
    subject_text = data.get("subject_text", "Website Contact Message")
    message_content = data.get("message", "")

    full_message = f"Phone: {phone}\nSubject: {subject_text}\nMessage: {message_content}"

    try:
        db = get_db_connection()
        cursor = db.cursor()
        query = "INSERT INTO contacts (name, email, message) VALUES (%s, %s, %s)"
        cursor.execute(query, (name, email, full_message))
        db.commit()
        cursor.close()
        db.close()

        # Contact email notification
        email_body = f"New Contact Inquiry:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nSubject: {subject_text}\nMessage: {message_content}"
        send_email_notification(f"New Inquiry from {name}", email_body, "shreebhargavainfra@gmail.com")

        return jsonify({"message": "Data Saved and Sent Successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Careers & Partnership Form API (Data goes to hr.sbacia@gmail.com)
@app.route("/careers", methods=["POST"])
def careers():
    data = request.form

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone", "")
    position = data.get("position", "N/A")
    experience = data.get("experience", "N/A")
    cover = data.get("cover", "")

    resume = request.files.get("resume")
    resume_name = resume.filename if resume else "No file uploaded"

    email_body = f"""
    New Career/Vendor/Contractor Submission:
    
    Name: {name}
    Email: {email}
    Phone: {phone}
    Position/Category: {position}
    Experience/Details: {experience}
    Message: {cover}
    Uploaded File: {resume_name}
    """

    try:
        # Careers email notification
        send_email_notification(f"New Application/Partnership from {name}", email_body, "hr.sbacia@gmail.com")
        
        return jsonify({"message": "Application Submitted Successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)