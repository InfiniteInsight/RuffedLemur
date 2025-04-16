# ruffedlemur/core/factory.py
"""
Application factory module for ruffedLemur.

This module is responsible for creating and configuring the Flask application.
"""
import os
from flask import Flask
from flask_cors import CORS

from ruffedlemur.core.extensions import db, migrate, jwt, api
from ruffedlemur.core.config import config_by_name


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
    
    # Enable CORS
    CORS(app)
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Register blueprints
    register_blueprints(app)
    
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
    from ruffedlemur.api.endpoints.certificates import certificates_bp
    from ruffedlemur.api.endpoints.authorities import authorities_bp
    from ruffedlemur.api.endpoints.users import users_bp
    from ruffedlemur.api.endpoints.roles import roles_bp
    from ruffedlemur.api.endpoints.auth import auth_bp
    
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