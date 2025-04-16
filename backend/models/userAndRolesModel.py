# ruffedlemur/models/userAndRoles.py
"""
User and Role models for ruffedLemur.

This module defines the User and Role models for authentication and authorization.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import JSONB
from werkzeug.security import generate_password_hash, check_password_hash

from ruffedlemur.models.base import BaseModel
from ruffedlemur.core.extensions import db


# Define the many-to-many relationship between users and roles
users_roles = Table(
    'users_roles',
    BaseModel.metadata,
    Column('user_id', ForeignKey('user.id'), primary_key=True),
    Column('role_id', ForeignKey('role.id'), primary_key=True)
)


class User(BaseModel):
    """
    User model for authentication and user management.
    """
    __tablename__ = 'user'
    
    # User details
    username = Column(String(128), unique=True, nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(255))
    
    # User properties
    active = Column(Boolean, default=True)
    profile_picture = Column(String(255))
    
    # Authentication source
    auth_type = Column(String(64), default='local')  # local, ldap, oauth, etc.
    
    # Additional data
    options = Column(JSONB, default={})
    
    # Relationships
    roles = relationship('Role', secondary=users_roles, backref=backref('users', lazy='dynamic'))
    
    def __init__(self, **kwargs):
        """Initialize the user."""
        self.username = kwargs.get('username')
        self.email = kwargs.get('email')
        self.active = kwargs.get('active', True)
        self.auth_type = kwargs.get('auth_type', 'local')
        self.options = kwargs.get('options', {})
        self.profile_picture = kwargs.get('profile_picture')
        
        if 'password' in kwargs:
            self.set_password(kwargs.get('password'))
        
        super(User, self).__init__(**kwargs)
    
    def set_password(self, password):
        """
        Set the user's password.
        
        Args:
            password: Plain text password
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Check if the provided password matches the user's password.
        
        Args:
            password: Plain text password
            
        Returns:
            True if the password matches, False otherwise
        """
        if self.password_hash:
            return check_password_hash(self.password_hash, password)
        return False
    
    def has_role(self, role_name):
        """
        Check if the user has a specific role.
        
        Args:
            role_name: Role name
            
        Returns:
            True if the user has the role, False otherwise
        """
        return any(role.name == role_name for role in self.roles)
    
    def has_permission(self, permission_name):
        """
        Check if the user has a specific permission.
        
        Args:
            permission_name: Permission name
            
        Returns:
            True if the user has the permission, False otherwise
        """
        return any(permission.name == permission_name for role in self.roles for permission in role.permissions)
    
    def to_dict(self):
        """
        Convert the user to a dictionary.
        
        Returns:
            Dictionary representation of the user
        """
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'active': self.active,
            'auth_type': self.auth_type,
            'roles': [role.name for role in self.roles],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        """String representation of the user."""
        return f"<User {self.username}>"


# Define the many-to-many relationship between roles and permissions
roles_permissions = Table(
    'roles_permissions',
    BaseModel.metadata,
    Column('role_id', ForeignKey('role.id'), primary_key=True),
    Column('permission_id', ForeignKey('permission.id'), primary_key=True)
)


class Role(BaseModel):
    """
    Role model for user authorization.
    """
    __tablename__ = 'role'
    
    # Role details
    name = Column(String(128), unique=True, nullable=False)
    description = Column(Text)
    
    # Additional data
    options = Column(JSONB, default={})
    
    # Relationships
    permissions = relationship('Permission', secondary=roles_permissions, backref=backref('roles', lazy='dynamic'))
    
    def __init__(self, **kwargs):
        """Initialize the role."""
        self.name = kwargs.get('name')
        self.description = kwargs.get('description')
        self.options = kwargs.get('options', {})
        super(Role, self).__init__(**kwargs)
    
    def to_dict(self):
        """
        Convert the role to a dictionary.
        
        Returns:
            Dictionary representation of the role
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'permissions': [permission.name for permission in self.permissions],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        """String representation of the role."""
        return f"<Role {self.name}>"


class Permission(BaseModel):
    """
    Permission model for role-based access control.
    """
    __tablename__ = 'permission'
    
    # Permission details
    name = Column(String(128), unique=True, nullable=False)
    description = Column(Text)
    
    # Resource and action that this permission applies to
    resource = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='_resource_action_uc'),
    )
    
    def __init__(self, **kwargs):
        """Initialize the permission."""
        self.name = kwargs.get('name')
        self.description = kwargs.get('description')
        self.resource = kwargs.get('resource')
        self.action = kwargs.get('action')
        super(Permission, self).__init__(**kwargs)
    
    def to_dict(self):
        """
        Convert the permission to a dictionary.
        
        Returns:
            Dictionary representation of the permission
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'resource': self.resource,
            'action': self.action,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        """String representation of the permission."""
        return f"<Permission {self.name}>"