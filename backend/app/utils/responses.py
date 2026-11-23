from flask import jsonify


def ok(data=None, status: int = 200):
    """Success: {"data": ...}"""
    return jsonify({"data": data}), status


def error(message: str, status: int = 400):
    """Failure: {"error": "message"} with a proper status code."""
    return jsonify({"error": message}), status
