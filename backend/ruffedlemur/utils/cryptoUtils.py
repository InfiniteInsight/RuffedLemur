# ruffedlemur/utils/cryptoUtils.py
"""
Cryptography utilities for RuffedLemur.

This module provides cryptography utilities for the application.
"""
from typing import Dict, Any, List, Optional, Union
import arrow
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.x509.extensions import Extension


def generate_private_key(key_type: str = 'rsa2048', key_size: int = 2048) -> Union[rsa.RSAPrivateKey, ec.EllipticCurvePrivateKey]:
    """
    Generate a private key.
    
    Args:
        key_type: Key type ('rsa2048', 'rsa4096', 'ecdsa256', 'ecdsa384')
        key_size: Key size (for RSA keys)
        
    Returns:
        Generated private key
    """
    if key_type.startswith('rsa'):
        return rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
    elif key_type == 'ecdsa256':
        return ec.generate_private_key(
            curve=ec.SECP256R1(),
            backend=default_backend()
        )
    elif key_type == 'ecdsa384':
        return ec.generate_private_key(
            curve=ec.SECP384R1(),
            backend=default_backend()
        )
    else:
        raise ValueError(f"Unsupported key type: {key_type}")


def create_csr(
    private_key: Union[rsa.RSAPrivateKey, ec.EllipticCurvePrivateKey],
    common_name: str,
    sans: List[Dict[str, str]] = None,
    organization: str = None,
    organizational_unit: str = None,
    country: str = None,
    state: str = None,
    location: str = None
) -> x509.CertificateSigningRequest:
    """
    Create a Certificate Signing Request (CSR).
    
    Args:
        private_key: Private key
        common_name: Common name
        sans: Subject Alternative Names
        organization: Organization
        organizational_unit: Organizational unit
        country: Country
        state: State
        location: Location
        
    Returns:
        Certificate Signing Request
    """
    # Build subject name
    name_attributes = []
    if common_name:
        name_attributes.append(x509.NameAttribute(NameOID.COMMON_NAME, common_name))
    if organization:
        name_attributes.append(x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization))
    if organizational_unit:
        name_attributes.append(x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, organizational_unit))
    if country:
        name_attributes.append(x509.NameAttribute(NameOID.COUNTRY_NAME, country))
    if state:
        name_attributes.append(x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, state))
    if location:
        name_attributes.append(x509.NameAttribute(NameOID.LOCALITY_NAME, location))
    
    subject = x509.Name(name_attributes)
    
    # Build CSR
    builder = x509.CertificateSigningRequestBuilder().subject_name(subject)
    
    # Add Subject Alternative Names
    if sans:
        san_names = []
        for san in sans:
            name_type = san.get('name', 'dns')
            value = san.get('value')
            
            if not value:
                continue
            
            if name_type.lower() == 'dns':
                san_names.append(x509.DNSName(value))
            elif name_type.lower() == 'ip':
                san_names.append(x509.IPAddress(value))
            elif name_type.lower() == 'email':
                san_names.append(x509.RFC822Name(value))
            elif name_type.lower() == 'uri':
                san_names.append(x509.UniformResourceIdentifier(value))
        
        if san_names:
            builder = builder.add_extension(
                x509.SubjectAlternativeName(san_names),
                critical=False
            )
    
    # Sign CSR
    if isinstance(private_key, rsa.RSAPrivateKey):
        csr = builder.sign(private_key, hashes.SHA256(), default_backend())
    else:
        csr = builder.sign(private_key, hashes.SHA256(), default_backend())
    
    return csr


def parse_certificate(cert_pem: str) -> Dict[str, Any]:
    """
    Parse certificate PEM and extract metadata.
    
    Args:
        cert_pem: Certificate PEM
        
    Returns:
        Certificate metadata
    """
    if not cert_pem:
        return {}
    
    # Load certificate
    cert = x509.load_pem_x509_certificate(cert_pem.encode(), default_backend())
    
    # Extract basic information
    result = {
        'common_name': get_cn_from_certificate(cert),
        'issuer': get_issuer_from_certificate(cert),
        'serial': format_serial(cert.serial_number),
        'not_before': arrow.get(cert.not_valid_before).datetime,
        'not_after': arrow.get(cert.not_valid_after).datetime,
        'subject': get_subject_from_certificate(cert),
        'key_type': get_key_type_from_certificate(cert),
        'signing_algorithm': get_signing_algorithm_from_certificate(cert),
        'is_ca': get_is_ca_from_certificate(cert),
        'bits': get_bits_from_certificate(cert),
        'san': get_san_from_certificate(cert),
        'extensions': get_extensions_from_certificate(cert)
    }
    
    return result


def get_cn_from_certificate(cert: x509.Certificate) -> Optional[str]:
    """
    Extract common name from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Common name or None
    """
    try:
        return cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    except (IndexError, ValueError):
        return None


def get_issuer_from_certificate(cert: x509.Certificate) -> str:
    """
    Extract issuer from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Issuer name
    """
    try:
        return cert.issuer.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    except (IndexError, ValueError):
        return 'Unknown'


def get_subject_from_certificate(cert: x509.Certificate) -> str:
    """
    Extract subject from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Subject name
    """
    subject_parts = []
    for attr in cert.subject:
        if attr.oid == NameOID.COMMON_NAME:
            subject_parts.append(f"CN={attr.value}")
        elif attr.oid == NameOID.ORGANIZATION_NAME:
            subject_parts.append(f"O={attr.value}")
        elif attr.oid == NameOID.ORGANIZATIONAL_UNIT_NAME:
            subject_parts.append(f"OU={attr.value}")
        elif attr.oid == NameOID.COUNTRY_NAME:
            subject_parts.append(f"C={attr.value}")
        elif attr.oid == NameOID.STATE_OR_PROVINCE_NAME:
            subject_parts.append(f"ST={attr.value}")
        elif attr.oid == NameOID.LOCALITY_NAME:
            subject_parts.append(f"L={attr.value}")
    
    return ', '.join(subject_parts)


def get_key_type_from_certificate(cert: x509.Certificate) -> str:
    """
    Extract key type from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Key type
    """
    public_key = cert.public_key()
    if isinstance(public_key, rsa.RSAPublicKey):
        key_size = public_key.key_size
        return f"rsa{key_size}"
    elif isinstance(public_key, ec.EllipticCurvePublicKey):
        curve = public_key.curve
        if isinstance(curve, ec.SECP256R1):
            return 'ecdsa256'
        elif isinstance(curve, ec.SECP384R1):
            return 'ecdsa384'
        else:
            return f"ecdsa-{curve.name}"
    else:
        return 'unknown'


def get_signing_algorithm_from_certificate(cert: x509.Certificate) -> str:
    """
    Extract signing algorithm from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Signing algorithm
    """
    signature_algorithm_oid = cert.signature_algorithm_oid
    # Convert OID to string representation
    return signature_algorithm_oid._name


def get_is_ca_from_certificate(cert: x509.Certificate) -> bool:
    """
    Check if certificate is a CA.
    
    Args:
        cert: Certificate
        
    Returns:
        True if CA, False otherwise
    """
    try:
        basic_constraints = cert.extensions.get_extension_for_oid(ExtensionOID.BASIC_CONSTRAINTS)
        return basic_constraints.value.ca
    except x509.extensions.ExtensionNotFound:
        return False


def get_bits_from_certificate(cert: x509.Certificate) -> Optional[int]:
    """
    Extract bits from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Bits or None
    """
    public_key = cert.public_key()
    if isinstance(public_key, rsa.RSAPublicKey):
        return public_key.key_size
    elif isinstance(public_key, ec.EllipticCurvePublicKey):
        curve = public_key.curve
        if isinstance(curve, ec.SECP256R1):
            return 256
        elif isinstance(curve, ec.SECP384R1):
            return 384
        else:
            return None
    else:
        return None


def get_san_from_certificate(cert: x509.Certificate) -> Optional[str]:
    """
    Extract subject alternative names from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Subject alternative names or None
    """
    try:
        san_extension = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        san_value = san_extension.value
        
        san_parts = []
        for name in san_value:
            if isinstance(name, x509.DNSName):
                san_parts.append(f"DNS:{name.value}")
            elif isinstance(name, x509.IPAddress):
                san_parts.append(f"IP:{name.value}")
            elif isinstance(name, x509.RFC822Name):
                san_parts.append(f"email:{name.value}")
            elif isinstance(name, x509.UniformResourceIdentifier):
                san_parts.append(f"URI:{name.value}")
        
        return ', '.join(san_parts)
    except x509.extensions.ExtensionNotFound:
        return None


def get_extensions_from_certificate(cert: x509.Certificate) -> Dict[str, Any]:
    """
    Extract extensions from certificate.
    
    Args:
        cert: Certificate
        
    Returns:
        Extensions
    """
    extensions = {}
    
    # Subject Alternative Names
    try:
        san_extension = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        san_value = san_extension.value
        
        sans = []
        for name in san_value:
            if isinstance(name, x509.DNSName):
                sans.append({'name': 'dns', 'value': name.value})
            elif isinstance(name, x509.IPAddress):
                sans.append({'name': 'ip', 'value': str(name.value)})
            elif isinstance(name, x509.RFC822Name):
                sans.append({'name': 'email', 'value': name.value})
            elif isinstance(name, x509.UniformResourceIdentifier):
                sans.append({'name': 'uri', 'value': name.value})
        
        extensions['sub_alt_names'] = sans
    except x509.extensions.ExtensionNotFound:
        pass
    
    # Key Usage
    try:
        key_usage_extension = cert.extensions.get_extension_for_oid(ExtensionOID.KEY_USAGE)
        key_usage_value = key_usage_extension.value
        
        key_usage = []
        if key_usage_value.digital_signature:
            key_usage.append('digital_signature')
        if key_usage_value.content_commitment:
            key_usage.append('content_commitment')
        if key_usage_value.key_encipherment:
            key_usage.append('key_encipherment')
        if key_usage_value.data_encipherment:
            key_usage.append('data_encipherment')
        if key_usage_value.key_agreement:
            key_usage.append('key_agreement')
        if key_usage_value.key_cert_sign:
            key_usage.append('key_cert_sign')
        if key_usage_value.crl_sign:
            key_usage.append('crl_sign')
        
        extensions['key_usage'] = key_usage
    except x509.extensions.ExtensionNotFound:
        pass
    
    # Extended Key Usage
    try:
        ext_key_usage_extension = cert.extensions.get_extension_for_oid(ExtensionOID.EXTENDED_KEY_USAGE)
        ext_key_usage_value = ext_key_usage_extension.value
        
        ext_key_usage = []
        for usage in ext_key_usage_value:
            ext_key_usage.append(usage._name)
        
        extensions['extended_key_usage'] = ext_key_usage
    except x509.extensions.ExtensionNotFound:
        pass
    
    return extensions


def format_serial(serial: int) -> str:
    """
    Format certificate serial number.
    
    Args:
        serial: Serial number
        
    Returns:
        Formatted serial number
    """
    # Convert to hexadecimal
    hex_serial = format(serial, 'x')
    
    # Ensure even length
    if len(hex_serial) % 2 != 0:
        hex_serial = '0' + hex_serial
    
    # Format with colons
    return ':'.join(hex_serial[i:i+2] for i in range(0, len(hex_serial), 2))


def get_organization_from_dn(distinguished_name: str) -> Optional[str]:
    """
    Extract organization from distinguished name.
    
    Args:
        distinguished_name: Distinguished name
        
    Returns:
        Organization or None
    """
    if not distinguished_name:
        return None
    
    parts = distinguished_name.split(', ')
    for part in parts:
        if part.startswith('O='):
            return part[2:]
    
    return None


def get_organizational_unit_from_dn(distinguished_name: str) -> Optional[str]:
    """
    Extract organizational unit from distinguished name.
    
    Args:
        distinguished_name: Distinguished name
        
    Returns:
        Organizational unit or None
    """
    if not distinguished_name:
        return None
    
    parts = distinguished_name.split(', ')
    for part in parts:
        if part.startswith('OU='):
            return part[3:]
    
    return None


def get_country_from_dn(distinguished_name: str) -> Optional[str]:
    """
    Extract country from distinguished name.
    
    Args:
        distinguished_name: Distinguished name
        
    Returns:
        Country or None
    """
    if not distinguished_name:
        return None
    
    parts = distinguished_name.split(', ')
    for part in parts:
        if part.startswith('C='):
            return part[2:]
    
    return None