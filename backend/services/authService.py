# ruffedlemur/services/authService.py
"""
Authentication service for RuffedLemur.

This module provides authentication services for the application.
"""
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timedelta
import uuid
import requests
import json
from urllib.parse import urlencode

from flask import current_app, url_for, redirect, request, session
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    get_jwt_identity, verify_jwt_in_request
)
from werkzeug.security import check_password_hash

from ruffedlemur.models.userAndRolesModel import User, Role
from ruffedlemur.api.errors import UnauthorizedError, ValidationError


def authenticate_user(username: str, password: str) -> Tuple[Dict[str, Any], User]:
    """
    Authenticate a user with username and password.
    
    Args:
        username: Username
        password: Password
        
    Returns:
        Tuple of (tokens, user)
        
    Raises:
        UnauthorizedError: If authentication fails
    """
    # Find user by username
    user = User.query.filter_by(username=username).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(password):
        raise UnauthorizedError("Invalid username or password")
    
    # Check if user is active
    if not user.active:
        raise UnauthorizedError("User account is deactivated")
    
    # Generate tokens
    tokens = generate_tokens(user)
    
    return tokens, user


def generate_tokens(user: User) -> Dict[str, Any]:
    """
    Generate access and refresh tokens for a user.
    
    Args:
        user: User
        
    Returns:
        Dictionary containing tokens
    """
    # Create access token
    expires_delta = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=1))
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'username': user.username,
            'email': user.email,
            'roles': [role.name for role in user.roles]
        },
        expires_delta=expires_delta
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        identity=user.id,
        expires_delta=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', timedelta(days=30))
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'expires_in': int(expires_delta.total_seconds())
    }


def refresh_access_token() -> Dict[str, Any]:
    """
    Refresh access token using refresh token.
    
    Returns:
        Dictionary containing new access token
        
    Raises:
        UnauthorizedError: If refresh token is invalid
    """
    # Get user ID from refresh token
    user_id = get_jwt_identity()
    
    # Find user
    user = User.query.get(user_id)
    if not user:
        raise UnauthorizedError("Invalid refresh token")
    
    # Check if user is active
    if not user.active:
        raise UnauthorizedError("User account is deactivated")
    
    # Create new access token
    expires_delta = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=1))
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'username': user.username,
            'email': user.email,
            'roles': [role.name for role in user.roles]
        },
        expires_delta=expires_delta
    )
    
    return {
        'access_token': access_token,
        'token_type': 'bearer',
        'expires_in': int(expires_delta.total_seconds())
    }


def has_role(role_name: str) -> bool:
    """
    Check if the current user has a specific role.
    
    Args:
        role_name: Role name
        
    Returns:
        True if the user has the role, False otherwise
    """
    # Verify JWT is present and valid
    try:
        verify_jwt_in_request()
    except Exception:
        return False
    
    # Get JWT claims
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    
    # Check if user has role
    roles = claims.get('roles', [])
    return role_name in roles


def has_permission(user: User, resource: str, action: str) -> bool:
    """
    Check if a user has permission to perform an action on a resource.
    
    Args:
        user: User
        resource: Resource name (e.g., 'certificate', 'authority')
        action: Action name (e.g., 'read', 'create', 'update', 'delete')
        
    Returns:
        True if the user has permission, False otherwise
    """
    # Check if user has any roles
    if not user.roles:
        return False
    
    # Check if user has admin role
    if any(role.name == 'admin' for role in user.roles):
        return True
    
    # Check if user has specific permission
    return any(
        permission.resource == resource and permission.action == action
        for role in user.roles
        for permission in role.permissions
    )


def require_permission(resource: str, action: str):
    """
    Decorator to require a specific permission.
    
    Args:
        resource: Resource name
        action: Action name
        
    Returns:
        Decorator function
        
    Raises:
        UnauthorizedError: If user is not authenticated
        ForbiddenError: If user does not have the required permission
    """
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request, get_current_user
    from ruffedlemur.api.errors import ForbiddenError
    
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present and valid
            verify_jwt_in_request()
            
            # Get current user
            user = get_current_user()
            
            # Check if user has permission
            if not has_permission(user, resource, action):
                raise ForbiddenError(f"Permission denied: {resource}:{action}")
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# SSO Authentication Support
def get_sso_providers() -> List[Dict[str, Any]]:
    """
    Get configured SSO providers.
    
    Returns:
        List of SSO provider configurations
    """
    sso_config = current_app.config.get('SSO_PROVIDERS', {})
    if not sso_config.get('enabled', False):
        return []
    
    return sso_config.get('providers', [])


def get_sso_provider(provider_name: str) -> Optional[Dict[str, Any]]:
    """
    Get SSO provider configuration by name.
    
    Args:
        provider_name: Provider name
        
    Returns:
        Provider configuration or None
    """
    providers = get_sso_providers()
    for provider in providers:
        if provider.get('name') == provider_name:
            return provider
    
    return None


def get_sso_login_url(provider_name: str) -> str:
    """
    Get login URL for SSO provider.
    
    Args:
        provider_name: Provider name
        
    Returns:
        Login URL
        
    Raises:
        ValueError: If provider not found or misconfigured
    """
    provider = get_sso_provider(provider_name)
    if not provider:
        raise ValueError(f"SSO provider {provider_name} not found")
    
    # Generate state token for CSRF protection
    state = str(uuid.uuid4())
    session['sso_state'] = state
    
    # Build authorization URL
    params = {
        'client_id': provider.get('client_id'),
        'redirect_uri': provider.get('redirect_uri'),
        'response_type': 'code',
        'scope': provider.get('scope', 'openid email profile'),
        'state': state
    }
    
    auth_url = f"{provider.get('auth_uri')}?{urlencode(params)}"
    return auth_url


def handle_sso_callback(provider_name: str, code: str, state: str) -> Tuple[Dict[str, Any], User]:
    """
    Handle SSO callback.
    
    Args:
        provider_name: Provider name
        code: Authorization code
        state: CSRF state token
        
    Returns:
        Tuple of (tokens, user)
        
    Raises:
        UnauthorizedError: If authentication fails
        ValidationError: If validation fails
    """
    # Verify state token for CSRF protection
    if state != session.get('sso_state'):
        raise ValidationError("Invalid state parameter")
    
    # Get provider configuration
    provider = get_sso_provider(provider_name)
    if not provider:
        raise ValidationError(f"SSO provider {provider_name} not found")
    
    # Exchange authorization code for tokens
    token_data = exchange_code_for_token(provider, code)
    if not token_data:
        raise UnauthorizedError("Failed to obtain access token")
    
    # Get user info
    user_info = get_user_info(provider, token_data)
    if not user_info:
        raise UnauthorizedError("Failed to obtain user info")
    
    # Find or create user
    user = find_or_create_sso_user(provider_name, user_info)
    
    # Generate tokens
    tokens = generate_tokens(user)
    
    return tokens, user


def exchange_code_for_token(provider: Dict[str, Any], code: str) -> Optional[Dict[str, Any]]:
    """
    Exchange authorization code for access token.
    
    Args:
        provider: Provider configuration
        code: Authorization code
        
    Returns:
        Token data or None
    """
    token_url = provider.get('token_uri')
    client_id = provider.get('client_id')
    client_secret = provider.get('client_secret')
    redirect_uri = provider.get('redirect_uri')
    
    # Prepare token request
    token_params = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    try:
        # Exchange code for token
        response = requests.post(token_url, data=token_params, timeout=10)
        response.raise_for_status()
        
        return response.json()
    
    except Exception as e:
        current_app.logger.error(f"Error exchanging code for token: {str(e)}")
        return None


def get_user_info(provider: Dict[str, Any], token_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Get user info from SSO provider.
    
    Args:
        provider: Provider configuration
        token_data: Token data
        
    Returns:
        User info or None
    """
    userinfo_url = provider.get('userinfo_uri')
    access_token = token_data.get('access_token')
    
    if not userinfo_url or not access_token:
        return None
    
    try:
        # Get user info
        headers = {'Authorization': f"Bearer {access_token}"}
        response = requests.get(userinfo_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        return response.json()
    
    except Exception as e:
        current_app.logger.error(f"Error getting user info: {str(e)}")
        return None


def find_or_create_sso_user(provider_name: str, user_info: Dict[str, Any]) -> User:
    """
    Find or create user from SSO user info.
    
    Args:
        provider_name: Provider name
        user_info: User info
        
    Returns:
        User
        
    Raises:
        UnauthorizedError: If user creation fails
    """
    from ruffedlemur.core.extensions import db
    
    # Extract user data
    email = user_info.get('email')
    if not email:
        raise UnauthorizedError("Email not provided by SSO provider")
    
    # Check if user exists
    user = User.query.filter_by(email=email).first()
    
    if user:
        # Update existing user
        user.auth_type = provider_name
        if not user.active:
            user.active = True
        
        # Update other fields if needed
        if 'name' in user_info and user_info.get('name'):
            user.username = user_info.get('name').replace(' ', '_').lower()
        
        db.session.commit()
        return user
    
    # Create new user
    username = email.split('@')[0]
    if 'name' in user_info and user_info.get('name'):
        username = user_info.get('name').replace(' ', '_').lower()
    
    # Ensure username is unique
    base_username = username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    # Create user
    user = User(
        username=username,
        email=email,
        auth_type=provider_name,
        active=True,
        options={
            'sso_provider': provider_name,
            'sso_data': {
                'name': user_info.get('name'),
                'picture': user_info.get('picture')
            }
        }
    )
    
    # Assign default role
    default_role_name = current_app.config.get('DEFAULT_SSO_ROLE', 'readonly')
    default_role = Role.query.filter_by(name=default_role_name).first()
    
    if default_role:
        user.roles.append(default_role)
    
    db.session.add(user)
    db.session.commit()
    
    return user