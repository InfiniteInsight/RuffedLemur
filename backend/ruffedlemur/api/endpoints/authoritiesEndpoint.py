# ruffedlemur/api/endpoints/authoritiesEndpoint.py
"""
Certificate Authority API endpoints for RuffedLemur.

This module defines the endpoints for certificate authority management.
"""
from flask import Blueprint, request, jsonify
from flask_smorest import Blueprint as SmorestBlueprint, abort
from flask_jwt_extended import jwt_required, get_current_user

from ruffedlemur.models.authorityModel import Authority
from ruffedlemur.services.authService import require_permission

# Create blueprints
authorities_bp = Blueprint('authorities', __name__)
authorities_api = SmorestBlueprint(
    'authorities', 'Certificate Authorities',
    description='Certificate authority management',
    url_prefix='/authorities'
)


@authorities_api.route('/', methods=['GET'])
@jwt_required()
def get_authorities():
    """Get all authorities."""
    try:
        authorities = Authority.query.all()
        return jsonify({
            'items': [authority.to_dict() for authority in authorities],
            'total': len(authorities)
        }), 200
    except Exception as e:
        abort(500, message=str(e))


@authorities_api.route('/<authority_id>', methods=['GET'])
@jwt_required()
def get_authority(authority_id):
    """Get authority by ID."""
    try:
        authority = Authority.get_by_id(authority_id)
        if not authority:
            abort(404, message=f"Authority with ID {authority_id} not found")
        return jsonify(authority.to_dict()), 200
    except Exception as e:
        abort(500, message=str(e))


@authorities_api.route('/', methods=['POST'])
@jwt_required()
@require_permission('authority', 'create')
def create_authority():
    """Create a new authority."""
    data = request.get_json()
    
    try:
        authority = Authority(**data)
        authority.save()
        return jsonify(authority.to_dict()), 201
    except Exception as e:
        abort(400, message=str(e))


@authorities_api.route('/<authority_id>', methods=['PUT'])
@jwt_required()
@require_permission('authority', 'update')
def update_authority(authority_id):
    """Update an authority."""
    data = request.get_json()
    
    try:
        authority = Authority.get_by_id(authority_id)
        if not authority:
            abort(404, message=f"Authority with ID {authority_id} not found")
        
        authority.update(**data)
        return jsonify(authority.to_dict()), 200
    except Exception as e:
        abort(400, message=str(e))


@authorities_api.route('/<authority_id>', methods=['DELETE'])
@jwt_required()
@require_permission('authority', 'delete')
def delete_authority(authority_id):
    """Delete an authority."""
    try:
        authority = Authority.get_by_id(authority_id)
        if not authority:
            abort(404, message=f"Authority with ID {authority_id} not found")
        
        authority.delete()
        return jsonify({
            'status': 'success',
            'message': f"Authority with ID {authority_id} deleted successfully"
        }), 200
    except Exception as e:
        abort(400, message=str(e))


# Register blueprint with Flask app
authorities_bp.register_blueprint(authorities_api)