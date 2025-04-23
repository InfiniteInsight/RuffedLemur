# ruffedlemur/services/certificateService.py
"""
Certificate service for RuffedLemur.

This module contains the business logic for certificate management.
"""
import arrow
from typing import Dict, List, Any, Optional, Tuple, Union
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from flask import current_app
from sqlalchemy import or_, and_, not_
from sqlalchemy.orm import joinedload

from ruffedlemur.core.extensions import db
from ruffedlemur.models.certificateModel import Certificate
from ruffedlemur.models.authorityModel import Authority
from ruffedlemur.plugins import get_plugin
from ruffedlemur.utils.cryptoUtils import (
    generate_private_key, create_csr, parse_certificate, 
    get_san_from_certificate, get_cn_from_certificate
)


def create_certificate(data: Dict[str, Any]) -> Certificate:
    """
    Create a new certificate.
    
    Args:
        data: Certificate data
        
    Returns:
        Created certificate
    """
    # Validate data
    _validate_certificate_data(data)
    
    # If using an existing CSR
    if data.get('csr'):
        return _create_certificate_from_csr(data)
    
    # Generate private key
    key_type = data.get('key_type', 'rsa2048')
    key_size = int(key_type[3:]) if key_type.startswith('rsa') else 2048
    private_key = generate_private_key(key_type=key_type, key_size=key_size)
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    # Create CSR
    common_name = data.get('common_name')
    sans = data.get('extensions', {}).get('sub_alt_names', [])
    organization = data.get('organization')
    organizational_unit = data.get('organizational_unit')
    country = data.get('country')
    state = data.get('state')
    location = data.get('location')
    
    csr = create_csr(
        private_key=private_key,
        common_name=common_name,
        sans=sans,
        organization=organization,
        organizational_unit=organizational_unit,
        country=country,
        state=state,
        location=location
    )
    
    csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode('utf-8')
    
    # Get authority
    authority_id = data.get('authority_id')
    authority = Authority.get_by_id(authority_id)
    if not authority:
        raise ValueError(f"Authority with ID {authority_id} not found")
    
    # Get issuer plugin
    issuer_plugin = get_plugin(authority.plugin_name)
    if not issuer_plugin:
        raise ValueError(f"Issuer plugin {authority.plugin_name} not found")
    
    # Create certificate
    issuer_options = authority.options or {}
    validity_days = data.get('validity_days', authority.default_validity_days)
    
    # Ensure certificate validity doesn't exceed authority validity
    if authority.not_after:
        authority_remaining_days = (arrow.get(authority.not_after) - arrow.utcnow()).days
        validity_days = min(validity_days, authority_remaining_days)
    
    certificate_data = issuer_plugin().create_certificate(
        csr=csr_pem,
        options={
            **issuer_options,
            'validity_days': validity_days,
            'signing_algorithm': data.get('signing_algorithm', authority.default_signing_algorithm),
        }
    )
    
    # Parse certificate
    cert_body = certificate_data.get('body')
    cert_chain = certificate_data.get('chain')
    
    # Create certificate model
    certificate = Certificate(
        name=data.get('name'),
        owner=data.get('owner'),
        description=data.get('description'),
        authority_id=authority_id,
        body=cert_body,
        chain=cert_chain,
        private_key=private_key_pem if data.get('store_private_key', True) else None,
        user_id=data.get('user_id'),
        destinations=data.get('destinations', []),
        notifications=data.get('notifications', []),
        rotation=data.get('rotation', False),
        rotation_policy_id=data.get('rotation_policy_id'),
        roles=data.get('roles', []),
    )
    
    db.session.add(certificate)
    db.session.commit()
    
    # Upload to destinations
    if certificate.destinations:
        for destination in certificate.destinations:
            destination_plugin = get_plugin(destination.plugin_name)
            if destination_plugin:
                try:
                    destination_plugin().upload_certificate(
                        certificate={
                            'name': certificate.name,
                            'body': certificate.body,
                            'chain': certificate.chain,
                            'private_key': certificate.private_key,
                        },
                        options=destination.options or {}
                    )
                except Exception as e:
                    current_app.logger.error(f"Failed to upload certificate to destination {destination.name}: {e}")
    
    return certificate


def _create_certificate_from_csr(data: Dict[str, Any]) -> Certificate:
    """
    Create a certificate from an existing CSR.
    
    Args:
        data: Certificate data with CSR
        
    Returns:
        Created certificate
    """
    csr_pem = data.get('csr')
    
    # Get authority
    authority_id = data.get('authority_id')
    authority = Authority.get_by_id(authority_id)
    if not authority:
        raise ValueError(f"Authority with ID {authority_id} not found")
    
    # Get issuer plugin
    issuer_plugin = get_plugin(authority.plugin_name)
    if not issuer_plugin:
        raise ValueError(f"Issuer plugin {authority.plugin_name} not found")
    
    # Create certificate
    issuer_options = authority.options or {}
    validity_days = data.get('validity_days', authority.default_validity_days)
    
    # Ensure certificate validity doesn't exceed authority validity
    if authority.not_after:
        authority_remaining_days = (arrow.get(authority.not_after) - arrow.utcnow()).days
        validity_days = min(validity_days, authority_remaining_days)
    
    certificate_data = issuer_plugin().create_certificate(
        csr=csr_pem,
        options={
            **issuer_options,
            'validity_days': validity_days,
            'signing_algorithm': data.get('signing_algorithm', authority.default_signing_algorithm),
        }
    )
    
    # Parse certificate
    cert_body = certificate_data.get('body')
    cert_chain = certificate_data.get('chain')
    
    # Create certificate model
    certificate = Certificate(
        name=data.get('name'),
        owner=data.get('owner'),
        description=data.get('description'),
        authority_id=authority_id,
        body=cert_body,
        chain=cert_chain,
        private_key=None,  # No private key when using CSR
        user_id=data.get('user_id'),
        destinations=data.get('destinations', []),
        notifications=data.get('notifications', []),
        rotation=data.get('rotation', False),
        rotation_policy_id=data.get('rotation_policy_id'),
        roles=data.get('roles', []),
    )
    
    db.session.add(certificate)
    db.session.commit()
    
    # Upload to destinations
    if certificate.destinations:
        for destination in certificate.destinations:
            destination_plugin = get_plugin(destination.plugin_name)
            if destination_plugin:
                try:
                    destination_plugin().upload_certificate(
                        certificate={
                            'name': certificate.name,
                            'body': certificate.body,
                            'chain': certificate.chain,
                            'private_key': certificate.private_key,
                        },
                        options=destination.options or {}
                    )
                except Exception as e:
                    current_app.logger.error(f"Failed to upload certificate to destination {destination.name}: {e}")
    
    return certificate


def _validate_certificate_data(data: Dict[str, Any]) -> None:
    """
    Validate certificate data.
    
    Args:
        data: Certificate data
        
    Raises:
        ValueError: If data is invalid
    """
    if not data.get('owner'):
        raise ValueError("Owner is required")
    
    if not data.get('common_name') and not data.get('csr'):
        raise ValueError("Common name or CSR is required")
    
    if not data.get('authority_id'):
        raise ValueError("Authority ID is required")


def get_certificate(certificate_id: str) -> Optional[Certificate]:
    """
    Get a certificate by ID.
    
    Args:
        certificate_id: Certificate ID
        
    Returns:
        Certificate or None
    """
    return Certificate.get_by_id(certificate_id)


def get_certificates(filter_params: Dict[str, Any] = None, page: int = 1, per_page: int = 20) -> Tuple[List[Certificate], int]:
    """
    Get certificates with filtering and pagination.
    
    Args:
        filter_params: Filter parameters
        page: Page number
        per_page: Items per page
        
    Returns:
        Tuple of (certificates, total)
    """
    query = Certificate.query.order_by(Certificate.not_after.desc())
    
    if filter_params:
        # Apply filters
        if 'name' in filter_params:
            query = query.filter(Certificate.name.ilike(f"%{filter_params['name']}%"))
        
        if 'common_name' in filter_params:
            query = query.filter(Certificate.cn.ilike(f"%{filter_params['common_name']}%"))
        
        if 'owner' in filter_params:
            query = query.filter(Certificate.owner.ilike(f"%{filter_params['owner']}%"))
        
        if 'active' in filter_params:
            active = filter_params['active']
            if isinstance(active, str):
                active = active.lower() in ('true', 'yes', '1')
            query = query.filter(Certificate.active == active)
        
        if 'expired' in filter_params:
            expired = filter_params['expired']
            if isinstance(expired, str):
                expired = expired.lower() in ('true', 'yes', '1')
            
            now = arrow.utcnow().datetime
            if expired:
                query = query.filter(Certificate.not_after < now)
            else:
                query = query.filter(Certificate.not_after >= now)
        
        if 'authority_id' in filter_params:
            query = query.filter(Certificate.authority_id == filter_params['authority_id'])
        
        if 'issuer' in filter_params:
            query = query.filter(Certificate.issuer.ilike(f"%{filter_params['issuer']}%"))
        
        if 'serial' in filter_params:
            query = query.filter(Certificate.serial == filter_params['serial'])
    
    # Count total
    total = query.count()
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    
    # Load relationships
    query = query.options(
        joinedload(Certificate.authority),
        joinedload(Certificate.user),
        joinedload(Certificate.destinations),
        joinedload(Certificate.notifications),
        joinedload(Certificate.roles)
    )
    
    # Execute query
    certificates = query.all()
    
    return certificates, total


def renew_certificate(certificate_id: str, validity_days: int = None) -> Certificate:
    """
    Renew a certificate.
    
    Args:
        certificate_id: Certificate ID
        validity_days: Validity days for the new certificate
        
    Returns:
        Renewed certificate
        
    Raises:
        ValueError: If certificate not found or renewal fails
    """
    # Get existing certificate
    certificate = get_certificate(certificate_id)
    if not certificate:
        raise ValueError(f"Certificate with ID {certificate_id} not found")
    
    # Check if certificate has a private key
    if not certificate.private_key:
        raise ValueError("Cannot renew certificate without private key")
    
    # Load private key
    private_key = serialization.load_pem_private_key(
        certificate.private_key.encode(),
        password=None,
        backend=default_backend()
    )
    
    # Create CSR
    common_name = certificate.cn
    
    # Parse existing SAN
    sans = []
    if certificate.san:
        for san_item in certificate.san.split(', '):
            parts = san_item.split(':')
            if len(parts) >= 2:
                sans.append({
                    'name': parts[0].lower(),
                    'value': parts[1]
                })
    
    # Extract DN components
    organization = None
    organizational_unit = None
    country = None
    
    if certificate.distinguished_name:
        dn_parts = certificate.distinguished_name.split(', ')
        for part in dn_parts:
            if part.startswith('O='):
                organization = part[2:]
            elif part.startswith('OU='):
                organizational_unit = part[3:]
            elif part.startswith('C='):
                country = part[2:]
    
    csr = create_csr(
        private_key=private_key,
        common_name=common_name,
        sans=sans,
        organization=organization,
        organizational_unit=organizational_unit,
        country=country
    )
    
    csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode('utf-8')
    
    # Get authority
    authority = Authority.get_by_id(certificate.authority_id)
    if not authority:
        raise ValueError(f"Authority with ID {certificate.authority_id} not found")
    
    # Get issuer plugin
    issuer_plugin = get_plugin(authority.plugin_name)
    if not issuer_plugin:
        raise ValueError(f"Issuer plugin {authority.plugin_name} not found")
    
    # Create new certificate
    issuer_options = authority.options or {}
    validity_days = validity_days or authority.default_validity_days
    
    # Ensure certificate validity doesn't exceed authority validity
    if authority.not_after:
        authority_remaining_days = (arrow.get(authority.not_after) - arrow.utcnow()).days
        validity_days = min(validity_days, authority_remaining_days)
    
    certificate_data = issuer_plugin().create_certificate(
        csr=csr_pem,
        options={
            **issuer_options,
            'validity_days': validity_days,
            'signing_algorithm': certificate.signing_algorithm or authority.default_signing_algorithm,
        }
    )
    
    # Create new certificate model
    new_certificate = Certificate(
        name=f"{certificate.name}-renewed",
        owner=certificate.owner,
        description=certificate.description,
        authority_id=certificate.authority_id,
        body=certificate_data.get('body'),
        chain=certificate_data.get('chain'),
        private_key=certificate.private_key,
        user_id=certificate.user_id,
        destinations=certificate.destinations,
        notifications=certificate.notifications,
        rotation=certificate.rotation,
        rotation_policy_id=certificate.rotation_policy_id,
        roles=certificate.roles,
    )
    
    # Set up replacement relationship
    new_certificate.replaces.append(certificate)
    
    db.session.add(new_certificate)
    db.session.commit()
    
    # Upload to destinations
    if new_certificate.destinations:
        for destination in new_certificate.destinations:
            destination_plugin = get_plugin(destination.plugin_name)
            if destination_plugin:
                try:
                    destination_plugin().upload_certificate(
                        certificate={
                            'name': new_certificate.name,
                            'body': new_certificate.body,
                            'chain': new_certificate.chain,
                            'private_key': new_certificate.private_key,
                        },
                        options=destination.options or {}
                    )
                except Exception as e:
                    current_app.logger.error(f"Failed to upload certificate to destination {destination.name}: {e}")
    
    return new_certificate


def revoke_certificate(certificate_id: str, reason: str = None) -> bool:
    """
    Revoke a certificate.
    
    Args:
        certificate_id: Certificate ID
        reason: Revocation reason
        
    Returns:
        True if successful, False otherwise
        
    Raises:
        ValueError: If certificate not found or revocation fails
    """
    # Get certificate
    certificate = get_certificate(certificate_id)
    if not certificate:
        raise ValueError(f"Certificate with ID {certificate_id} not found")
    
    # Check if already revoked
    if certificate.revoked:
        return True
    
    # Get authority
    authority = Authority.get_by_id(certificate.authority_id)
    if not authority:
        raise ValueError(f"Authority with ID {certificate.authority_id} not found")
    
    # Get issuer plugin
    issuer_plugin = get_plugin(authority.plugin_name)
    if not issuer_plugin:
        raise ValueError(f"Issuer plugin {authority.plugin_name} not found")
    
    # Revoke certificate
    issuer_options = authority.options or {}
    
    try:
        revoked = issuer_plugin().revoke_certificate(
            certificate={
                'name': certificate.name,
                'body': certificate.body,
                'serial': certificate.serial,
            },
            options={
                **issuer_options,
                'reason': reason,
            }
        )
        
        if revoked:
            # Update certificate status
            certificate.revoked = True
            certificate.status = 'revoked'
            db.session.commit()
            return True
        else:
            return False
    except Exception as e:
        current_app.logger.error(f"Failed to revoke certificate: {e}")
        raise ValueError(f"Failed to revoke certificate: {str(e)}")


def export_certificate(certificate_id: str, export_format: str = 'pem') -> Dict[str, str]:
    """
    Export a certificate in the specified format.
    
    Args:
        certificate_id: Certificate ID
        export_format: Export format ('pem', 'pkcs12', 'jks')
        
    Returns:
        Dictionary with exported data
        
    Raises:
        ValueError: If certificate not found or export fails
    """
    # Get certificate
    certificate = get_certificate(certificate_id)
    if not certificate:
        raise ValueError(f"Certificate with ID {certificate_id} not found")
    
    # Basic PEM export
    if export_format == 'pem':
        result = {
            'certificate': certificate.body,
            'chain': certificate.chain,
        }
        
        # Include private key if available
        if certificate.private_key:
            result['private_key'] = certificate.private_key
        
        return result
    
    # Other formats require plugins
    export_plugin = None
    
    if export_format == 'pkcs12':
        export_plugin = get_plugin('pkcs12-exporter')
    elif export_format == 'jks':
        export_plugin = get_plugin('jks-exporter')
    
    if not export_plugin:
        raise ValueError(f"Export format {export_format} not supported")
    
    # Export using plugin
    try:
        return export_plugin().export_certificate(
            certificate={
                'name': certificate.name,
                'body': certificate.body,
                'chain': certificate.chain,
                'private_key': certificate.private_key,
            }
        )
    except Exception as e:
        current_app.logger.error(f"Failed to export certificate: {e}")
        raise ValueError(f"Failed to export certificate: {str(e)}")


def get_expiring_certificates(days: int = 30) -> List[Certificate]:
    """
    Get certificates that will expire within the specified number of days.
    
    Args:
        days: Number of days
        
    Returns:
        List of expiring certificates
    """
    expiry_date = arrow.utcnow().shift(days=days).datetime
    
    return Certificate.query.filter(
        Certificate.not_after <= expiry_date,
        Certificate.not_after >= arrow.utcnow().datetime,
        Certificate.revoked == False
    ).all()