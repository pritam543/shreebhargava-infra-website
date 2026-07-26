from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__)
CORS(app)

# MySQL Connection
db = mysql.connector.connect(
    host=os.environ.get("MYSQL_HOST"),
    user=os.environ.get("MYSQL_USER"),
    password=os.environ.get("MYSQL_PASSWORD"),
    database=os.environ.get("MYSQL_DATABASE"),
    port=int(os.environ.get("MYSQL_PORT"))
)

cursor = db.cursor()


# Open Website
@app.route("/")
def home():
    return send_file("index.html")


# Contact Form API
@app.route("/contact", methods=["POST"])
def contact():

    data = request.json

    name = data["name"]
    email = data["email"]
    message = data["message"]

    query = """
    INSERT INTO contacts (name, email, message)
    VALUES (%s, %s, %s)
    """

    cursor.execute(query, (name, email, message))
    db.commit()

    return jsonify({
        "message": "Data Saved Successfully"
    })


if __name__ == "__main__":
    app.run(debug=True)