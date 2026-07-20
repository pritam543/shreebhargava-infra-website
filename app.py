from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)


# MySQL Connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Pritam@123",
    database="portfolio_db"
)

cursor = db.cursor()


@app.route("/")
def home():
    return "Backend Connected Successfully!"


@app.route("/contact", methods=["POST"])
def contact():

    print("Contact route reached!")

    data = request.json

    name = data["name"]
    email = data["email"]
    message = data["message"]

    print("Name:", name)
    print("Email:", email)
    print("Message:", message)


    # Insert data into MySQL
    query = """
    INSERT INTO contacts (name, email, message)
    VALUES (%s, %s, %s)
    """

    values = (name, email, message)

    cursor.execute(query, values)
    db.commit()


    return jsonify({
        "message": "Data Saved Successfully"
    })  


if __name__ == "__main__":
    app.run(debug=True)