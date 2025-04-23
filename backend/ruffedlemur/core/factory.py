# backend/core/factory.py
"""
Application factory module for ruffedLemur.

This module is responsible for creating and configuring the Flask application.
"""
import os
from flask import Flask
from flask_cors import CORS

from ruffedlemur.core.extensions import db, migrate, jwt, api
from ruffedlemur.core.lemur_conf import config_by_name
from ruffedlemur.middleware.security_headers import setup_security_headers


def create_app(config_name="development"):
    """
    Create and configure the Flask application.
    
    Args:
        config_name: The configuration environment to use.
                    One of: development, testing, production.
    
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_by_name[config_name])
    
   # Configure CORS more securely
    if app.config.get('ENV') == 'production':
        # In production, limit CORS to specific origins
        CORS(app, resources={
            r"/api/*": {
                "origins": app.config.get('ALLOWED_ORIGINS', ['https://your-production-domain.com']),
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
                "expose_headers": ["Content-Type", "X-CSRF-TOKEN"],
                "supports_credentials": True,
                "max_age": 600
            }
        })
    else:
        # In development, allow all origins
        CORS(app)

     # Configure session security
    app.config['SESSION_COOKIE_SECURE'] = app.config.get('ENV') == 'production'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Register blueprints
    register_blueprints(app)

    # Setup security headers
    setup_security_headers(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register commands
    register_commands(app)
    
    # Initialize plugins
    initialize_plugins(app)
    
    return app


def initialize_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    api.init_app(app)


def register_blueprints(app):
    """Register Flask blueprints."""
    from ruffedlemur.api.endpoints.certificatesEndpoint import certificates_bp
    from ruffedlemur.api.endpoints.authoritiesEndpoint import authorities_bp
    from backend.ruffedlemur.api.endpoints.usersAndRolesEndpoint import users_bp, roles_bp
    from ruffedlemur.api.endpoints.authEndpoint import auth_bp
    
    app.register_blueprint(certificates_bp, url_prefix='/api/v1')
    app.register_blueprint(authorities_bp, url_prefix='/api/v1')
    app.register_blueprint(users_bp, url_prefix='/api/v1')
    app.register_blueprint(roles_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1')


def register_error_handlers(app):
    """Register error handlers."""
    from ruffedlemur.api.errors import (
        handle_not_found_error,
        handle_validation_error,
        handle_internal_server_error,
        handle_unauthorized_error,
    )
    
    app.register_error_handler(404, handle_not_found_error)
    app.register_error_handler(422, handle_validation_error)
    app.register_error_handler(500, handle_internal_server_error)
    app.register_error_handler(401, handle_unauthorized_error)


def register_commands(app):
    """Register CLI commands."""
    # Import and register commands here
    pass


def initialize_plugins(app):
    """Initialize plugins."""
    # Import and initialize plugins here
    from ruffedlemur.plugins import init_plugins
    init_plugins(app)