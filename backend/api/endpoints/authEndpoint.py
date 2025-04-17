# ruffedlemur/api/endpoints/authEndpoint.py
"""
Authentication API endpoints for RuffedLemur.

This module defines the authentication endpoints for the API.
"""
from flask import Blueprint, request, jsonify, redirect, session, url_for, current_app
from flask_smorest import Blueprint as SmorestBlueprint, abort
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_current_user,
    verify_jwt_in_request, create_access_token
)
from marshmallow import Schema, fields, validate, ValidationError

from ruffedlemur.api.errors import UnauthorizedError, ValidationError as APIValidationError
from ruffedlemur.services.authService import (
    authenticate_user, refresh_access_token, get_sso_providers,
    get_sso_login_url, handle_sso_callback
)


# Define schemas
class LoginSchema(Schema):
    """Schema for login request."""
    username = fields.String(required=True)
    password = fields.String(required=True)


class TokenSchema(Schema):
    """Schema for token response."""
    access_token = fields.String(required=True)
    refresh_token = fields.String(required=True)
    token_type = fields.String(required=True)
    expires_in = fields.Integer(required=True)


class RefreshTokenSchema(Schema):
    """Schema for refresh token response."""
    access_token = fields.String(required=True)
    token_type = fields.String(required=True)
    expires_in = fields.Integer(required=True)


class SSOProviderSchema(Schema):
    """Schema for SSO provider."""
    name = fields.String(required=True)
    display_name = fields.String(required=True)
    icon = fields.String(required=False)


class SSOProvidersSchema(Schema):
    """Schema for SSO providers response."""
    providers = fields.List(fields.Nested(SSOProviderSchema), required=True)


# Create blueprints
auth_bp = Blueprint('auth', __name__)
auth_api = SmorestBlueprint(
    'auth', 'Authentication',
    description='Authentication endpoints',
    url_prefix='/auth'
)


@auth_api.route('/login', methods=['POST'])
@auth_api.arguments(LoginSchema)
@auth_api.response(200, TokenSchema)
def login(login_data):
    """
    Authenticate a user and return access token.
    
    ---
    tags:
      - Authentication
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/LoginSchema'
    responses:
      200:
        description: Authentication successful
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TokenSchema'
      401:
        description: Authentication failed
    """
    try:
        # Authenticate user
        tokens, user = authenticate_user(
            username=login_data['username'],
            password=login_data['password']
        )
        
        return tokens
    
    except UnauthorizedError as e:
        abort(401, message=str(e))


@auth_api.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
@auth_api.response(200, RefreshTokenSchema)
def refresh():
    """
    Refresh access token.
    
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    responses:
      200:
        description: Token refreshed successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshTokenSchema'
      401:
        description: Invalid refresh token
    """
    try:
        tokens = refresh_access_token()
        return tokens
    
    except UnauthorizedError as e:
        abort(401, message=str(e))


@auth_api.route('/me', methods=['GET'])
@jwt_required()
def me():
    """
    Get current user information.
    
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    responses:
      200:
        description: User information
      401:
        description: Not authenticated
    """
    user = get_current_user()
    return jsonify(user.to_dict())


@auth_api.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user.
    
    ---
    tags:
      - Authentication
    security:
      - BearerAuth: []
    responses:
      200:
        description: Logged out successfully
      401:
        description: Not authenticated
    """
    # JWT blacklisting would be implemented here
    # For now, we'll just return a success message
    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully'
    })


# ruffedlemur/api/endpoints/authEndpoint.py (continued)

@auth_api.route('/sso/providers', methods=['GET'])
@auth_api.response(200, SSOProvidersSchema)
def get_sso_providers_list():
    """
    Get available SSO providers.
    
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Available SSO providers
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SSOProvidersSchema'
    """
    providers = get_sso_providers()
    
    # Format response
    formatted_providers = []
    for provider in providers:
        formatted_providers.append({
            'name': provider.get('name'),
            'display_name': provider.get('display_name', provider.get('name').title()),
            'icon': provider.get('icon')
        })
    
    return {'providers': formatted_providers}


@auth_api.route('/sso/<provider_name>', methods=['GET'])
def sso_login(provider_name):
    """
    Initiate SSO login flow.
    
    ---
    tags:
      - Authentication
    parameters:
      - name: provider_name
        in: path
        description: SSO provider name
        required: true
        schema:
          type: string
    responses:
      302:
        description: Redirect to SSO provider
      400:
        description: Invalid provider
    """
    try:
        login_url = get_sso_login_url(provider_name)
        return redirect(login_url)
    
    except ValueError as e:
        abort(400, message=str(e))


@auth_api.route('/sso/<provider_name>/callback', methods=['GET'])
def sso_callback(provider_name):
    """
    Handle SSO callback.
    
    ---
    tags:
      - Authentication
    parameters:
      - name: provider_name
        in: path
        description: SSO provider name
        required: true
        schema:
          type: string
      - name: code
        in: query
        description: Authorization code
        required: true
        schema:
          type: string
      - name: state
        in: query
        description: CSRF state token
        required: true
        schema:
          type: string
    responses:
      200:
        description: Authentication successful
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TokenSchema'
      400:
        description: Invalid request
      401:
        description: Authentication failed
    """
    try:
        # Get authorization code and state
        code = request.args.get('code')
        state = request.args.get('state')
        
        if not code or not state:
            abort(400, message="Missing required parameters")
        
        # Handle SSO callback
        tokens, user = handle_sso_callback(provider_name, code, state)
        
        # For API clients
        if request.headers.get('Accept') == 'application/json':
            return jsonify(tokens)
        
        # For browser clients, redirect to frontend with token
        frontend_url = current_app.config.get('FRONTEND_URL', '/')
        redirect_url = f"{frontend_url}?token={tokens['access_token']}"
        
        return redirect(redirect_url)
    
    except (ValueError, APIValidationError) as e:
        if request.headers.get('Accept') == 'application/json':
            abort(400, message=str(e))
        
        # For browser clients, redirect to frontend with error
        frontend_url = current_app.config.get('FRONTEND_URL', '/')
        error_url = f"{frontend_url}?error={str(e)}"
        
        return redirect(error_url)
    
    except UnauthorizedError as e:
        if request.headers.get('Accept') == 'application/json':
            abort(401, message=str(e))
        
        # For browser clients, redirect to frontend with error
        frontend_url = current_app.config.get('FRONTEND_URL', '/')
        error_url = f"{frontend_url}?error={str(e)}"
        
        return redirect(error_url)


# REST API routes for authentication (alternative to smorest)
@auth_bp.route('/api/v1/login', methods=['POST'])
def api_login():
    """Login endpoint for REST API."""
    schema = LoginSchema()
    
    try:
        # Validate request data
        data = schema.load(request.get_json())
        
        # Authenticate user
        tokens, user = authenticate_user(
            username=data['username'],
            password=data['password']
        )
        
        return jsonify(tokens), 200
    
    except ValidationError as e:
        raise APIValidationError(str(e))
    
    except UnauthorizedError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 401
        }), 401


@auth_bp.route('/api/v1/refresh', methods=['POST'])
def api_refresh():
    """Refresh token endpoint for REST API."""
    try:
        # Verify refresh token
        verify_jwt_in_request(refresh=True)
        
        # Refresh access token
        tokens = refresh_access_token()
        
        return jsonify(tokens), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 401
        }), 401


@auth_bp.route('/api/v1/sso/providers', methods=['GET'])
def api_get_sso_providers():
    """Get SSO providers endpoint for REST API."""
    providers = get_sso_providers()
    
    # Format response
    formatted_providers = []
    for provider in providers:
        formatted_providers.append({
            'name': provider.get('name'),
            'display_name': provider.get('display_name', provider.get('name').title()),
            'icon': provider.get('icon'),
            'login_url': url_for('auth.api_sso_login', provider_name=provider.get('name'), _external=True)
        })
    
    return jsonify({'providers': formatted_providers}), 200


@auth_bp.route('/api/v1/sso/<provider_name>', methods=['GET'])
def api_sso_login(provider_name):
    """Initiate SSO login flow endpoint for REST API."""
    try:
        login_url = get_sso_login_url(provider_name)
        return jsonify({
            'status': 'success',
            'login_url': login_url
        }), 200
    
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 400
        }), 400


@auth_bp.route('/api/v1/sso/<provider_name>/callback', methods=['GET'])
def api_sso_callback(provider_name):
    """Handle SSO callback endpoint for REST API."""
    try:
        # Get authorization code and state
        code = request.args.get('code')
        state = request.args.get('state')
        
        if not code or not state:
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameters',
                'code': 400
            }), 400
        
        # Handle SSO callback
        tokens, user = handle_sso_callback(provider_name, code, state)
        
        return jsonify(tokens), 200
    
    except (ValueError, APIValidationError) as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 400
        }), 400
    
    except UnauthorizedError as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 401
        }), 401
    
# Cross Site Request Forgery protection
@auth_bp.route('/api/v1/csrf-token', methods=['GET'])
def get_csrf_token():
    """Get CSRF token for forms."""
    token = generate_csrf_token()  # Implement this function
    return jsonify({
        'token': token
    })



# Register blueprint with Flask app
auth_bp.register_blueprint(auth_api)