# ruffedlemur/models/certificate.py
"""
Certificate model for ruffedLemur.

This module defines the Certificate model and related tables.
"""
import arrow
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, ForeignKey, Table, Integer, Index
)
from sqlalchemy.dialects.postgresql import JSON, JSONB
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.hybrid import hybrid_property
from cryptography import x509
from cryptography.hazmat.backends import default_backend

from ruffedlemur.models.base import BaseModel
from ruffedlemur.core.extensions import db
from ruffedlemur.utils.crypto import parse_certificate

# Many-to-many relationship tables
certificate_destination_associations = Table(
    'certificate_destination_associations',
    BaseModel.metadata,
    Column('certificate_id', ForeignKey('certificate.id'), primary_key=True),
    Column('destination_id', ForeignKey('destination.id'), primary_key=True)
)

certificate_notification_associations = Table(
    'certificate_notification_associations',
    BaseModel.metadata,
    Column('certificate_id', ForeignKey('certificate.id'), primary_key=True),
    Column('notification_id', ForeignKey('notification.id'), primary_key=True)
)

certificate_source_associations = Table(
    'certificate_source_associations',
    BaseModel.metadata,
    Column('certificate_id', ForeignKey('certificate.id'), primary_key=True),
    Column('source_id', ForeignKey('source.id'), primary_key=True)
)

certificate_replacement_associations = Table(
    'certificate_replacement_associations',
    BaseModel.metadata,
    Column('certificate_id', ForeignKey('certificate.id'), primary_key=True),
    Column('replaced_certificate_id', ForeignKey('certificate.id'), primary_key=True)
)

roles_certificates = Table(
    'roles_certificates',
    BaseModel.metadata,
    Column('role_id', ForeignKey('role.id'), primary_key=True),
    Column('certificate_id', ForeignKey('certificate.id'), primary_key=True)
)


class Certificate(BaseModel):
    """
    Certificate model for storing certificate information.
    """
    __tablename__ = 'certificate'
    
    # Certificate details
    name = Column(String(128), unique=True)
    owner = Column(String(128))
    description = Column(Text)
    
    # Certificate data
    body = Column(Text, nullable=False)
    chain = Column(Text)
    private_key = Column(Text)
    
    # Certificate metadata
    cn = Column(String(128))
    serial = Column(String(128))
    status = Column(String(32))
    
    # Certificate validity
    not_before = Column(DateTime)
    not_after = Column(DateTime)
    
    # Certificate properties
    bits = Column(Integer)
    san = Column(Text)
    issuer = Column(String(128))
    distinguished_name = Column(String(128))
    key_type = Column(String(32))
    signing_algorithm = Column(String(32))
    
    # Certificate flags
    is_ca = Column(Boolean, default=False)
    revoked = Column(Boolean, default=False)
    rotation = Column(Boolean, default=False)
    has_private_key = Column(Boolean, default=False)
    
    # Certificate source
    external_id = Column(String(128))
    external_source_id = Column(String(128))
    
    # Additional data
    extensions = Column(JSONB)
    
    # Relationships
    authority_id = Column(ForeignKey('authority.id'))
    authority = relationship('Authority', backref=backref('certificates', lazy='dynamic'))
    
    user_id = Column(ForeignKey('user.id'))
    user = relationship('User', backref=backref('certificates', lazy='dynamic'))
    
    rotation_policy_id = Column(ForeignKey('rotation_policy.id', name='certificate_rotation_policy_id_fkey'))
    rotation_policy = relationship('RotationPolicy', backref=backref('certificates', lazy='dynamic'))
    
    sources = relationship('Source', secondary=certificate_source_associations, backref='certificates')
    destinations = relationship('Destination', secondary=certificate_destination_associations, backref='certificates')
    notifications = relationship('Notification', secondary=certificate_notification_associations, backref='certificates')
    replaces = relationship('Certificate', secondary=certificate_replacement_associations,
                            primaryjoin=id == certificate_replacement_associations.c.certificate_id,
                            secondaryjoin=id == certificate_replacement_associations.c.replaced_certificate_id,
                            backref='replaced')
    roles = relationship('Role', secondary=roles_certificates, backref='certificates')
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_certificate_cn', cn),
        Index('ix_certificate_name', name),
        Index('ix_certificate_not_after', not_after),
        Index('ix_certificate_serial', serial),
    )
    
    def __init__(self, **kwargs):
        """Initialize the certificate."""
        self.parse_certificate(kwargs.get('body'))
        super(Certificate, self).__init__(**kwargs)
    
    def parse_certificate(self, body):
        """
        Parse certificate body and extract metadata.
        
        Args:
            body: Certificate body in PEM format
        """
        if not body:
            return
        
        cert_data = parse_certificate(body)
        
        self.body = body
        self.cn = cert_data.get('common_name')
        self.issuer = cert_data.get('issuer')
        self.serial = cert_data.get('serial')
        self.san = cert_data.get('san')
        self.not_before = cert_data.get('not_before')
        self.not_after = cert_data.get('not_after')
        self.distinguished_name = cert_data.get('subject')
        self.key_type = cert_data.get('key_type')
        self.signing_algorithm = cert_data.get('signing_algorithm')
        self.is_ca = cert_data.get('is_ca', False)
        self.bits = cert_data.get('bits')
        self.extensions = cert_data.get('extensions')
    
    @hybrid_property
    def expired(self):
        """Check if the certificate is expired."""
        if self.not_after:
            return arrow.utcnow() > arrow.get(self.not_after)
        return False
    
    @hybrid_property
    def organization(self):
        """Extract organization from distinguished name."""
        from ruffedlemur.utils.crypto import get_organization_from_dn
        if self.distinguished_name:
            return get_organization_from_dn(self.distinguished_name)
        return None
    
    @hybrid_property
    def organizational_unit(self):
        """Extract organizational unit from distinguished name."""
        from ruffedlemur.utils.crypto import get_organizational_unit_from_dn
        if self.distinguished_name:
            return get_organizational_unit_from_dn(self.distinguished_name)
        return None
    
    @hybrid_property
    def country(self):
        """Extract country from distinguished name."""
        from ruffedlemur.utils.crypto import get_country_from_dn
        if self.distinguished_name:
            return get_country_from_dn(self.distinguished_name)
        return None
    
    @hybrid_property
    def remaining_days(self):
        """Calculate remaining days before expiration."""
        if self.not_after:
            return (arrow.get(self.not_after) - arrow.utcnow()).days
        return 0
    
    def __repr__(self):
        """String representation of the certificate."""
        return f"<Certificate {self.name}>"