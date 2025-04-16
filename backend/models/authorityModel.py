# ruffedlemur/models/authority.py
"""
Authority model for ruffedLemur.

This module defines the Authority model for certificate authorities.
"""
import arrow
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.hybrid import hybrid_property

from ruffedlemur.models.base import BaseModel
from ruffedlemur.core.extensions import db
from ruffedlemur.utils.crypto import parse_certificate


class Authority(BaseModel):
    """
    Authority model for certificate authorities.
    
    This model stores information about certificate authorities (CAs) that can issue certificates.
    """
    __tablename__ = 'authority'
    
    # Authority details
    name = Column(String(128), unique=True)
    owner = Column(String(128))
    description = Column(Text)
    
    # Authority certificate data
    body = Column(Text)
    chain = Column(Text)
    private_key = Column(Text)
    
    # Authority validity
    not_before = Column(DateTime)
    not_after = Column(DateTime)
    
    # Authority properties
    plugin_name = Column(String(64))
    options = Column(JSONB)
    
    # Certificate issuance settings
    default_validity_days = Column(Integer, default=365)
    default_key_type = Column(String(32), default='rsa2048')
    default_signing_algorithm = Column(String(32), default='sha256WithRSA')
    
    # Authority flags
    active = Column(Boolean, default=True)
    
    # Relationships
    user_id = Column(ForeignKey('user.id'))
    user = relationship('User', backref=backref('authorities', lazy='dynamic'))
    
    roles = relationship('Role', secondary='roles_authorities', backref='authorities')
    
    def __init__(self, **kwargs):
        """Initialize the authority."""
        self.parse_certificate(kwargs.get('body'))
        super(Authority, self).__init__(**kwargs)
    
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
        self.not_before = cert_data.get('not_before')
        self.not_after = cert_data.get('not_after')
    
    @hybrid_property
    def expired(self):
        """Check if the authority certificate is expired."""
        if self.not_after:
            return arrow.utcnow() > arrow.get(self.not_after)
        return False
    
    @hybrid_property
    def remaining_days(self):
        """Calculate remaining days before expiration."""
        if self.not_after:
            return (arrow.get(self.not_after) - arrow.utcnow()).days
        return 0
    
    @hybrid_property
    def max_issuance_days(self):
        """
        Calculate maximum issuance days for new certificates.
        
        Certificates cannot be issued for a period longer than the CA's remaining validity.
        """
        if self.not_after:
            return min(self.default_validity_days, self.remaining_days)
        return self.default_validity_days
    
    def __repr__(self):
        """String representation of the authority."""
        return f"<Authority {self.name}>"


# Define the many-to-many relationship between roles and authorities
roles_authorities = db.Table(
    'roles_authorities',
    BaseModel.metadata,
    Column('role_id', ForeignKey('role.id'), primary_key=True),
    Column('authority_id', ForeignKey('authority.id'), primary_key=True)
)