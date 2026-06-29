from flask import jsonify
from datetime import datetime

class ResponseCode:
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    VALIDATION_ERROR = 422

def success(data=None, message='success'):
    return jsonify({
        'code': ResponseCode.SUCCESS,
        'message': message,
        'data': data,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.SUCCESS

def bad_request(message='Bad request'):
    return jsonify({
        'code': ResponseCode.BAD_REQUEST,
        'message': message,
        'data': None,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.BAD_REQUEST

def unauthorized(message='Unauthorized'):
    return jsonify({
        'code': ResponseCode.UNAUTHORIZED,
        'message': message,
        'data': None,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.UNAUTHORIZED

def forbidden(message='Forbidden'):
    return jsonify({
        'code': ResponseCode.FORBIDDEN,
        'message': message,
        'data': None,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.FORBIDDEN

def not_found(message='Not found'):
    return jsonify({
        'code': ResponseCode.NOT_FOUND,
        'message': message,
        'data': None,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.NOT_FOUND

def internal_error(message='Internal server error'):
    return jsonify({
        'code': ResponseCode.INTERNAL_ERROR,
        'message': message,
        'data': None,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.INTERNAL_ERROR

def validation_error(message='Validation error', errors=None):
    return jsonify({
        'code': ResponseCode.VALIDATION_ERROR,
        'message': message,
        'data': errors,
        'timestamp': int(datetime.now().timestamp())
    }), ResponseCode.VALIDATION_ERROR