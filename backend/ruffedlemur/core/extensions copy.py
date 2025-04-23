# ruffedlemur/core/extensions.py
"""
Extensions module for ruffedLemur.

This module initializes Flask extensions used throughout the application.
"""
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_smorest import Api
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import declarative_base

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
api = Api()

# Create a base model class that all models will inherit from
Base = declarative_base()


# JWT token callbacks
@jwt.user_identity_loader
def user_identity_lookup(user):
    """
    Define how to store the user identity in a JWT.
    
    Args:
        user: User object or user ID
        
    Returns:
        User ID to store in the JWT
    """
    return user.id if hasattr(user, 'id') else user


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """
    Define how to load a user from a JWT.
    
    Args:
        _jwt_header: JWT header
        jwt_data: JWT data
        
    Returns:
        User object or None
    """
    from ruffedlemur.models.user import User
    
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()


# API error handlers
@api.handle_http_exception
def handle_http_exception(error):
    """
    Global HTTP exception handler for API.
    
    Args:
        error: HTTP exception
        
    Returns:
        Error response
    """
    response = {
        "code": error.code,
        "status": "error",
        "message": error.description,
    }
    return response, error.code