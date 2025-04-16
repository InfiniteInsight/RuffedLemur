# backend/migrations/versions/001_initial_schema.py
"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-04-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create user table
    op.create_table(
        'user',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('username', sa.String(128), unique=True, nullable=False),
        sa.Column('email', sa.String(128), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255)),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('auth_type', sa.String(64), default='local'),
        sa.Column('profile_picture', sa.String(255)),
        sa.Column('options', postgresql.JSONB, default={}),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create role table
    op.create_table(
        'role',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('options', postgresql.JSONB, default={}),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create permission table
    op.create_table(
        'permission',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('resource', sa.String(128), nullable=False),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('resource', 'action', name='_resource_action_uc')
    )
    
    # Create users_roles table (many-to-many)
    op.create_table(
        'users_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id'), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('role.id'), primary_key=True)
    )
    
    # Create roles_permissions table (many-to-many)
    op.create_table(
        'roles_permissions',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('role.id'), primary_key=True),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permission.id'), primary_key=True)
    )
    
    # Create authority table
    op.create_table(
        'authority',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('owner', sa.String(128)),
        sa.Column('description', sa.Text()),
        sa.Column('body', sa.Text()),
        sa.Column('chain', sa.Text()),
        sa.Column('private_key', sa.Text()),
        sa.Column('not_before', sa.DateTime()),
        sa.Column('not_after', sa.DateTime()),
        sa.Column('plugin_name', sa.String(64)),
        sa.Column('options', postgresql.JSONB),
        sa.Column('default_validity_days', sa.Integer(), default=365),
        sa.Column('default_key_type', sa.String(32), default='rsa2048'),
        sa.Column('default_signing_algorithm', sa.String(32), default='sha256WithRSA'),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id')),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create roles_authorities table (many-to-many)
    op.create_table(
        'roles_authorities',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('role.id'), primary_key=True),
        sa.Column('authority_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('authority.id'), primary_key=True)
    )
    
    # Create rotation_policy table
    op.create_table(
        'rotation_policy',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('days', sa.Integer(), default=90),
        sa.Column('autorotate', sa.Boolean(), default=False),
        sa.Column('options', postgresql.JSONB),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create certificate table
    op.create_table(
        'certificate',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True),
        sa.Column('owner', sa.String(128)),
        sa.Column('description', sa.Text()),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('chain', sa.Text()),
        sa.Column('private_key', sa.Text()),
        sa.Column('cn', sa.String(128)),
        sa.Column('serial', sa.String(128)),
        sa.Column('status', sa.String(32)),
        sa.Column('not_before', sa.DateTime()),
        sa.Column('not_after', sa.DateTime()),
        sa.Column('bits', sa.Integer()),
        sa.Column('san', sa.Text()),
        sa.Column('issuer', sa.String(128)),
        sa.Column('distinguished_name', sa.String(128)),
        sa.Column('key_type', sa.String(32)),
        sa.Column('signing_algorithm', sa.String(32)),
        sa.Column('is_ca', sa.Boolean(), default=False),
        sa.Column('revoked', sa.Boolean(), default=False),
        sa.Column('rotation', sa.Boolean(), default=False),
        sa.Column('has_private_key', sa.Boolean(), default=False),
        sa.Column('external_id', sa.String(128)),
        sa.Column('external_source_id', sa.String(128)),
        sa.Column('extensions', postgresql.JSONB),
        sa.Column('authority_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('authority.id')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id')),
        sa.Column('rotation_policy_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('rotation_policy.id')),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create certificate associations
    # certificate_source_associations
    op.create_table(
        'certificate_source_associations',
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('source.id'), primary_key=True)
    )
    
    # certificate_destination_associations
    op.create_table(
        'certificate_destination_associations',
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True),
        sa.Column('destination_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('destination.id'), primary_key=True)
    )
    
    # certificate_notification_associations
    op.create_table(
        'certificate_notification_associations',
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True),
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('notification.id'), primary_key=True)
    )
    
    # certificate_replacement_associations
    op.create_table(
        'certificate_replacement_associations',
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True),
        sa.Column('replaced_certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True)
    )
    
    # roles_certificates
    op.create_table(
        'roles_certificates',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('role.id'), primary_key=True),
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id'), primary_key=True)
    )
    
    # Create indexes
    op.create_index('ix_certificate_cn', 'certificate', ['cn'])
    op.create_index('ix_certificate_name', 'certificate', ['name'])
    op.create_index('ix_certificate_not_after', 'certificate', ['not_after'])
    op.create_index('ix_certificate_serial', 'certificate', ['serial'])


def downgrade():
    # Drop tables in reverse order
    op.drop_table('roles_certificates')
    op.drop_table('certificate_replacement_associations')
    op.drop_table('certificate_notification_associations')
    op.drop_table('certificate_destination_associations')
    op.drop_table('certificate_source_associations')
    op.drop_table('certificate')
    op.drop_table('rotation_policy')
    op.drop_table('roles_authorities')
    op.drop_table('authority')
    op.drop_table('roles_permissions')
    op.drop_table('users_roles')
    op.drop_table('permission')
    op.drop_table('role')
    op.drop_table('user')