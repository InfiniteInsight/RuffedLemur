# ruffedlemur/api/endpoints/usersEndpoint.py
"""
User and Role API endpoints for RuffedLemur.

This module defines the endpoints for user and role management.
"""
from flask import Blueprint, request, jsonify
from flask_smorest import Blueprint as SmorestBlueprint, abort
from flask_jwt_extended import jwt_required, get_current_user

from ruffedlemur.models.userAndRolesModel import User, Role, Permission
from ruffedlemur.services.authService import require_permission

# Create blueprints
users_bp = Blueprint('users', __name__)
users_api = SmorestBlueprint(
    'users', 'Users',
    description='User management',
    url_prefix='/users'
)

roles_bp = Blueprint('roles', __name__)
roles_api = SmorestBlueprint(
    'roles', 'Roles',
    description='Role management',
    url_prefix='/roles'
)


# User endpoints
@users_api.route('/', methods=['GET'])
@jwt_required()
@require_permission('user', 'read')
def get_users():
    """Get all users."""
    try:
        users = User.query.all()
        return jsonify({
            'items': [user.to_dict() for user in users],
            'total': len(users)
        }), 200
    except Exception as e:
        abort(500, message=str(e))


@users_api.route('/<user_id>', methods=['GET'])
@jwt_required()
@require_permission('user', 'read')
def get_user(user_id):
    """Get user by ID."""
    try:
        user = User.get_by_id(user_id)
        if not user:
            abort(404, message=f"User with ID {user_id} not found")
        return jsonify(user.to_dict()), 200
    except Exception as e:
        abort(500, message=str(e))


@users_api.route('/', methods=['POST'])
@jwt_required()
@require_permission('user', 'create')
def create_user():
    """Create a new user."""
    data = request.get_json()
    
    try:
        # Extract role IDs
        role_ids = data.pop('roles', [])
        roles = [Role.get_by_id(role_id) for role_id in role_ids]
        
        # Create user
        user = User(**data)
        user.roles = [role for role in roles if role]
        user.save()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        abort(400, message=str(e))


@users_api.route('/<user_id>', methods=['PUT'])
@jwt_required()
@require_permission('user', 'update')
def update_user(user_id):
    """Update a user."""
    data = request.get_json()
    
    try:
        user = User.get_by_id(user_id)
        if not user:
            abort(404, message=f"User with ID {user_id} not found")
        
        # Extract role IDs
        role_ids = data.pop('roles', None)
        if role_ids is not None:
            roles = [Role.get_by_id(role_id) for role_id in role_ids]
            user.roles = [role for role in roles if role]
        
        user.update(**data)
        return jsonify(user.to_dict()), 200
    except Exception as e:
        abort(400, message=str(e))


@users_api.route('/<user_id>', methods=['DELETE'])
@jwt_required()
@require_permission('user', 'delete')
def delete_user(user_id):
    """Delete a user."""
    try:
        user = User.get_by_id(user_id)
        if not user:
            abort(404, message=f"User with ID {user_id} not found")
        
        user.delete()
        return jsonify({
            'status': 'success',
            'message': f"User with ID {user_id} deleted successfully"
        }), 200
    except Exception as e:
        abort(400, message=str(e))


# Role endpoints
@roles_api.route('/', methods=['GET'])
@jwt_required()
@require_permission('role', 'read')
def get_roles():
    """Get all roles."""
    try:
        roles = Role.query.all()
        return jsonify({
            'items': [role.to_dict() for role in roles],
            'total': len(roles)
        }), 200
    except Exception as e:
        abort(500, message=str(e))


@roles_api.route('/<role_id>', methods=['GET'])
@jwt_required()
@require_permission('role', 'read')
def get_role(role_id):
    """Get role by ID."""
    try:
        role = Role.get_by_id(role_id)
        if not role:
            abort(404, message=f"Role with ID {role_id} not found")
        return jsonify(role.to_dict()), 200
    except Exception as e:
        abort(500, message=str(e))


@roles_api.route('/', methods=['POST'])
@jwt_required()
@require_permission('role', 'create')
def create_role():
    """Create a new role."""
    data = request.get_json()
    
    try:
        # Extract permission IDs
        permission_ids = data.pop('permissions', [])
        permissions = [Permission.get_by_id(permission_id) for permission_id in permission_ids]
        
        # Create role
        role = Role(**data)
        role.permissions = [permission for permission in permissions if permission]
        role.save()
        
        return jsonify(role.to_dict()), 201
    except Exception as e:
        abort(400, message=str(e))


@roles_api.route('/<role_id>', methods=['PUT'])
@jwt_required()
@require_permission('role', 'update')
def update_role(role_id):
    """Update a role."""
    data = request.get_json()
    
    try:
        role = Role.get_by_id(role_id)
        if not role:
            abort(404, message=f"Role with ID {role_id} not found")
        
        # Extract permission IDs
        permission_ids = data.pop('permissions', None)
        if permission_ids is not None:
            permissions = [Permission.get_by_id(permission_id) for permission_id in permission_ids]
            role.permissions = [permission for permission in permissions if permission]
        
        role.update(**data)
        return jsonify(role.to_dict()), 200
    except Exception as e:
        abort(400, message=str(e))


@roles_api.route('/<role_id>', methods=['DELETE'])
@jwt_required()
@require_permission('role', 'delete')
def delete_role(role_id):
    """Delete a role."""
    try:
        role = Role.get_by_id(role_id)
        if not role:
            abort(404, message=f"Role with ID {role_id} not found")
        
        role.delete()
        return jsonify({
            'status': 'success',
            'message': f"Role with ID {role_id} deleted successfully"
        }), 200
    except Exception as e:
        abort(400, message=str(e))


# Register blueprints with Flask app
users_bp.register_blueprint(users_api)
roles_bp.register_blueprint(roles_api)