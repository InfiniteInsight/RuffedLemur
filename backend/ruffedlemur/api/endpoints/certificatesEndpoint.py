# ruffedlemur/api/endpoints/certificatesEndpoint.py
"""
Certificate API endpoints for RuffedLemur.

This module defines the endpoints for certificate management.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_smorest import Blueprint as SmorestBlueprint, abort
from flask_jwt_extended import jwt_required, get_current_user
from marshmallow import Schema, fields, validate, ValidationError, EXCLUDE
from sqlalchemy import or_, and_

from ruffedlemur.models.certificateModel import Certificate
from ruffedlemur.services.certificateService import (
    create_certificate, get_certificate, get_certificates
)
from ruffedlemur.api.errors import NotFoundError, ValidationError as APIValidationError
from ruffedlemur.services.authService import require_permission


# Define schemas
class CommonNameSchema(Schema):
    """Schema for common name."""
    common_name = fields.String(required=True)


class SubjectAlternativeNameSchema(Schema):
    """Schema for subject alternative name."""
    name = fields.String(required=True)
    value = fields.String(required=True)


class ExtensionsSchema(Schema):
    """Schema for certificate extensions."""
    sub_alt_names = fields.List(fields.Nested(SubjectAlternativeNameSchema), required=False)
    key_usage = fields.List(fields.String(), required=False)
    extended_key_usage = fields.List(fields.String(), required=False)


class DestinationSchema(Schema):
    """Schema for certificate destination."""
    id = fields.UUID(required=True)
    options = fields.Dict(required=False)


class NotificationSchema(Schema):
    """Schema for certificate notification."""
    id = fields.UUID(required=True)


class CreateCertificateSchema(Schema):
    """Schema for creating a certificate."""
    name = fields.String(required=False)
    owner = fields.String(required=True)
    description = fields.String(required=False)
    common_name = fields.String(required=True)
    authority_id = fields.UUID(required=True)
    organization = fields.String(required=False)
    organizational_unit = fields.String(required=False)
    country = fields.String(required=False)
    state = fields.String(required=False)
    location = fields.String(required=False)
    validity_days = fields.Integer(required=False, validate=validate.Range(min=1, max=3650))
    key_type = fields.String(required=False, validate=validate.OneOf(['rsa2048', 'rsa4096', 'ecdsa256', 'ecdsa384']))
    signing_algorithm = fields.String(required=False, validate=validate.OneOf(['sha256WithRSA', 'sha384WithRSA', 'sha512WithRSA', 'sha256WithECDSA', 'sha384WithECDSA']))
    store_private_key = fields.Boolean(required=False)
    extensions = fields.Nested(ExtensionsSchema, required=False)
    destinations = fields.List(fields.Nested(DestinationSchema), required=False)
    notifications = fields.List(fields.Nested(NotificationSchema), required=False)
    rotation = fields.Boolean(required=False)
    rotation_policy_id = fields.UUID(required=False)
    roles = fields.List(fields.UUID(), required=False)
    
    class Meta:
        """Meta class for schema."""
        unknown = EXCLUDE


class CertificateSchema(Schema):
    """Schema for certificate response."""
    id = fields.UUID(required=True)
    name = fields.String(required=True)
    owner = fields.String(required=True)
    description = fields.String(required=False, allow_none=True)
    cn = fields.String(required=True)
    issuer = fields.String(required=True)
    serial = fields.String(required=True)
    not_before = fields.DateTime(required=True)
    not_after = fields.DateTime(required=True)
    status = fields.String(required=False, allow_none=True)
    bits = fields.Integer(required=False, allow_none=True)
    san = fields.String(required=False, allow_none=True)
    distinguished_name = fields.String(required=False, allow_none=True)
    key_type = fields.String(required=False, allow_none=True)
    signing_algorithm = fields.String(required=False, allow_none=True)
    is_ca = fields.Boolean(required=True)
    revoked = fields.Boolean(required=True)
    rotation = fields.Boolean(required=True)
    has_private_key = fields.Boolean(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)


class CertificateListSchema(Schema):
    """Schema for certificate list response."""
    items = fields.List(fields.Nested(CertificateSchema), required=True)
    total = fields.Integer(required=True)
    page = fields.Integer(required=True)
    pages = fields.Integer(required=True)


# Create blueprints
certificates_bp = Blueprint('certificates', __name__)
certificates_api = SmorestBlueprint(
    'certificates', 'Certificates',
    description='Certificate management',
    url_prefix='/certificates'
)


@certificates_api.route('/', methods=['GET'])
@certificates_api.response(200, CertificateListSchema)
@jwt_required()
def get_certificates_list():
    """
    Get a list of certificates.
    
    ---
    tags:
      - Certificates
    parameters:
      - name: page
        in: query
        description: Page number
        schema:
          type: integer
          default: 1
      - name: per_page
        in: query
        description: Items per page
        schema:
          type: integer
          default: 20
      - name: name
        in: query
        description: Filter by name
        schema:
          type: string
      - name: common_name
        in: query
        description: Filter by common name
        schema:
          type: string
      - name: owner
        in: query
        description: Filter by owner
        schema:
          type: string
      - name: active
        in: query
        description: Filter by active status
        schema:
          type: boolean
      - name: expired
        in: query
        description: Filter by expired status
        schema:
          type: boolean
    security:
      - BearerAuth: []
    responses:
      200:
        description: List of certificates
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificateListSchema'
      401:
        description: Not authenticated
    """
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # Build filter parameters
    filter_params = {}
    for key in ['name', 'common_name', 'owner', 'active', 'expired', 'authority_id', 'issuer', 'serial']:
        if key in request.args:
            filter_params[key] = request.args.get(key)
    
    # Get certificates
    certificates_list, total = get_certificates(
        filter_params=filter_params,
        page=page,
        per_page=per_page
    )
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    # Prepare response
    result = {
        'items': [cert.to_dict() for cert in certificates_list],
        'total': total,
        'page': page,
        'pages': pages
    }
    
    return result


@certificates_api.route('/<uuid:certificate_id>', methods=['GET'])
@certificates_api.response(200, CertificateSchema)
@jwt_required()
def get_certificate_by_id(certificate_id):
    """
    Get a certificate by ID.
    
    ---
    tags:
      - Certificates
    parameters:
      - name: certificate_id
        in: path
        description: Certificate ID
        required: true
        schema:
          type: string
          format: uuid
    security:
      - BearerAuth: []
    responses:
      200:
        description: Certificate details
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificateSchema'
      404:
        description: Certificate not found
      401:
        description: Not authenticated
    """
    certificate = get_certificate(str(certificate_id))
    if not certificate:
        abort(404, message=f"Certificate with ID {certificate_id} not found")
    
    return certificate.to_dict()


@certificates_api.route('/', methods=['POST'])
@certificates_api.arguments(CreateCertificateSchema)
@certificates_api.response(201, CertificateSchema)
@jwt_required()
@require_permission('certificate', 'create')
def create_new_certificate(certificate_data):
    """
    Create a new certificate.
    
    ---
    tags:
      - Certificates
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateCertificateSchema'
    security:
      - BearerAuth: []
    responses:
      201:
        description: Certificate created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificateSchema'
      400:
        description: Invalid input
      401:
        description: Not authenticated
      403:
        description: Not authorized
    """
    try:
        # Get current user
        user = get_current_user()
        
        # Add user ID to certificate data
        certificate_data['user_id'] = user.id
        
        # Create certificate
        certificate = create_certificate(certificate_data)
        
        return certificate.to_dict(), 201
    
    except Exception as e:
        current_app.logger.error(f"Failed to create certificate: {str(e)}")
        abort(400, message=str(e))


# REST API route for getting certificates (alternative to smorest)
@certificates_bp.route('/api/v1/certificates', methods=['GET'])
@jwt_required()
def api_get_certificates():
    """Get certificates endpoint for REST API."""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Build filter parameters
        filter_params = {}
        for key in ['name', 'common_name', 'owner', 'active', 'expired', 'authority_id', 'issuer', 'serial']:
            if key in request.args:
                filter_params[key] = request.args.get(key)
        
        # Get certificates
        certificates_list, total = get_certificates(
            filter_params=filter_params,
            page=page,
            per_page=per_page
        )
        
        # Calculate total pages
        pages = (total + per_page - 1) // per_page
        
        # Prepare response
        result = {
            'items': [cert.to_dict() for cert in certificates_list],
            'total': total,
            'page': page,
            'pages': pages
        }
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 500
        }), 500


# Register blueprint with Flask app
certificates_bp.register_blueprint(certificates_api)