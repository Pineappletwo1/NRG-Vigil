from flask import Flask, jsonify

from flask_svelte import render_template

app = Flask(__name__)

@app.route("/api/test", methods=["GET"])
def return_test(): 
    return jsonify("test")

@app.route("/")
def index():
    return render_template("index.html", name="Vigil")