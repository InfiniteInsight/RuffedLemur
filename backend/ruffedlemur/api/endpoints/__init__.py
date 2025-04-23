# ruffedlemur/api/endpoints/__init__.py
"""
API endpoints for RuffedLemur.
"""

from ruffedlemur.api.endpoints.authEndpoint import auth_bp
from ruffedlemur.api.endpoints.authoritiesEndpoint import authorities_bp
from ruffedlemur.api.endpoints.usersEndpoint import users_bp, roles_bp
from ruffedlemur.api.endpoints.certificatesEndpoint import certificates_bp