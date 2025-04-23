# ruffedlemur/core/config.py
"""
Configuration module for ruffedLemur.

This module manages different configuration environments for the application.
"""
import os
from datetime import timedelta
from typing import Dict, Type, Any

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class BaseConfig:
    """Base configuration."""
    
    # Application
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = False
    TESTING = False
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'postgresql://postgres:736pNSIOwPZa6Ib6MVgi@localhost:5432/ruffedlemur')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # API Documentation
    API_TITLE = 'ruffedLemur API'
    API_VERSION = 'v1'
    OPENAPI_VERSION = '3.0.2'
    OPENAPI_URL_PREFIX = '/docs'
    OPENAPI_SWAGGER_UI_PATH = '/swagger'
    OPENAPI_SWAGGER_UI_URL = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/'
    
    # Lemur specific settings
    LEMUR_TOKEN_SECRET = os.getenv('LEMUR_TOKEN_SECRET', SECRET_KEY)
    LEMUR_ENCRYPTION_KEYS = os.getenv('LEMUR_ENCRYPTION_KEYS', 'default-key').split(',')
    
    # Email notifications
    LEMUR_EMAIL = os.getenv('LEMUR_EMAIL', 'lemur@example.com')
    LEMUR_SECURITY_TEAM_EMAIL = os.getenv('LEMUR_SECURITY_TEAM_EMAIL', 'security@example.com')
    
    # Plugin settings
    ACTIVE_PROVIDERS = {
        'certificate': [],
        'notification': [],
        'destination': [],
        'source': [],
        'issuer': [],
    }
    
    # Default certificate validity period
    DEFAULT_VALIDITY_DAYS = 365
    
    # Default CA expiration notification intervals
    DEFAULT_CA_EXPIRATION_INTERVALS = [90, 60, 30, 15, 7, 3, 1]
    
    # Default certificate expiration notification intervals
    DEFAULT_CERT_EXPIRATION_INTERVALS = [30, 15, 7, 3, 1]


class DevelopmentConfig(BaseConfig):
    """Development configuration."""
    
    DEBUG = True
    SQLALCHEMY_ECHO = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)  # Extended for development


class TestingConfig(BaseConfig):
    """Testing configuration."""
    
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('TEST_DATABASE_URI', 'postgresql://postgres:postgres@localhost:5432/ruffedlemur_test')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)  # Short expiry for testing


class ProductionConfig(BaseConfig):
    """Production configuration."""
    
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    LEMUR_TOKEN_SECRET = os.getenv('LEMUR_TOKEN_SECRET')
    
    # Ensure these are set in production
    if not all([SECRET_KEY, JWT_SECRET_KEY, LEMUR_TOKEN_SECRET]):
        raise ValueError("Production environment requires SECRET_KEY, JWT_SECRET_KEY, and LEMUR_TOKEN_SECRET to be set")
    
    # Database connection pooling for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', 10)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 20)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 300)),
        'pool_pre_ping': True,
    }


# Configuration dictionary mapping
config_by_name: Dict[str, Type[BaseConfig]] = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}

# Default configuration
DefaultConfig = config_by_name[os.getenv('FLASK_ENV', 'development')]