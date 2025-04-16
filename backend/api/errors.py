# ruffedlemur/api/errors.py
"""
API error handling for RuffedLemur.

This module provides standardized error handling for the API.
"""
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    """Base API error class."""
    
    status_code = 500
    message = "An unexpected error occurred"
    
    def __init__(self, message=None, status_code=None, payload=None):
        """Initialize the error."""
        super().__init__(message or self.message)
        self.message = message or self.message
        self.status_code = status_code or self.status_code
        self.payload = payload
    
    def to_dict(self):
        """Convert the error to a dictionary."""
        rv = {
            'status': 'error',
            'message': self.message,
            'code': self.status_code
        }
        if self.payload:
            rv['data'] = self.payload
        return rv


class ValidationError(APIError):
    """Validation error."""
    
    status_code = 422
    message = "Invalid input data"


class NotFoundError(APIError):
    """Not found error."""
    
    status_code = 404
    message = "Resource not found"


class UnauthorizedError(APIError):
    """Unauthorized error."""
    
    status_code = 401
    message = "Unauthorized"


class ForbiddenError(APIError):
    """Forbidden error."""
    
    status_code = 403
    message = "Forbidden"


class ConflictError(APIError):
    """Conflict error."""
    
    status_code = 409
    message = "Resource already exists"


# Error handlers
def handle_api_error(error):
    """Handle API errors."""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


def handle_validation_error(error):
    """Handle validation errors."""
    current_app.logger.warning(f"Validation error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': 'Invalid input data',
        'code': 422,
        'errors': str(error) if hasattr(error, 'messages') else error.description
    }), 422


def handle_not_found_error(error):
    """Handle not found errors."""
    current_app.logger.info(f"Not found error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': error.description or 'Resource not found',
        'code': 404
    }), 404


def handle_unauthorized_error(error):
    """Handle unauthorized errors."""
    current_app.logger.warning(f"Unauthorized error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': error.description or 'Unauthorized',
        'code': 401
    }), 401


def handle_forbidden_error(error):
    """Handle forbidden errors."""
    current_app.logger.warning(f"Forbidden error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': error.description or 'Forbidden',
        'code': 403
    }), 403


def handle_internal_server_error(error):
    """Handle internal server errors."""
    current_app.logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'status': 'error',
        'message': 'An unexpected error occurred',
        'code': 500
    }), 500


def register_error_handlers(app):
    """Register error handlers with the Flask app."""
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(NotFoundError, handle_not_found_error)
    app.register_error_handler(UnauthorizedError, handle_unauthorized_error)
    app.register_error_handler(ForbiddenError, handle_forbidden_error)
    app.register_error_handler(500, handle_internal_server_error)
    app.register_error_handler(404, handle_not_found_error)
    app.register_error_handler(401, handle_unauthorized_error)
    app.register_error_handler(403, handle_forbidden_error)
    
    # Handle all HTTP exceptions
    app.register_error_handler(HTTPException, lambda e: (
        jsonify({
            'status': 'error',
            'message': e.description,
            'code': e.code
        }), e.code
    ))