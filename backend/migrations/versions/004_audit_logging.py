# backend/migrations/versions/004_audit_logging.py
"""Add audit logging tables

Revision ID: 004_audit_logging
Revises: 003_notification_system
Create Date: 2023-09-01 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '004_audit_logging'
down_revision = '003_notification_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create audit_log table for tracking all actions
    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id')),
        sa.Column('username', sa.String(128)),  # Denormalized for faster queries and historical accuracy
        sa.Column('resource_type', sa.String(64), nullable=False),  # 'certificate', 'authority', 'user', etc.
        sa.Column('resource_id', postgresql.UUID(as_uuid=True)),
        sa.Column('action', sa.String(32), nullable=False),  # 'create', 'update', 'delete', 'view', etc.
        sa.Column('status', sa.String(16), nullable=False),  # 'success', 'failed'
        sa.Column('details', postgresql.JSONB),
        sa.Column('ip_address', sa.String(45)),  # IPv6-compatible
        sa.Column('user_agent', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now())
    )
    
    # Create login_log table for tracking login attempts
    op.create_table(
        'login_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id')),
        sa.Column('username', sa.String(128)),  # Username used in login attempt
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('auth_type', sa.String(32)),  # 'password', 'sso', etc.
        sa.Column('ip_address', sa.String(45)),  # IPv6-compatible
        sa.Column('user_agent', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now())
    )
    
    # Create api_log table for tracking API requests
    op.create_table(
        'api_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id')),
        sa.Column('method', sa.String(10), nullable=False),  # GET, POST, PUT, DELETE, etc.
        sa.Column('path', sa.String(2048), nullable=False),
        sa.Column('query_params', postgresql.JSONB),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('response_time', sa.Float()),  # Response time in milliseconds
        sa.Column('ip_address', sa.String(45)),  # IPv6-compatible
        sa.Column('user_agent', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now())
    )
    
    # Create indexes
    op.create_index('ix_audit_log_user_id', 'audit_log', ['user_id'])
    op.create_index('ix_audit_log_resource_type', 'audit_log', ['resource_type'])
    op.create_index('ix_audit_log_resource_id', 'audit_log', ['resource_id'])
    op.create_index('ix_audit_log_action', 'audit_log', ['action'])
    op.create_index('ix_audit_log_created_at', 'audit_log', ['created_at'])
    
    op.create_index('ix_login_log_user_id', 'login_log', ['user_id'])
    op.create_index('ix_login_log_username', 'login_log', ['username'])
    op.create_index('ix_login_log_success', 'login_log', ['success'])
    op.create_index('ix_login_log_created_at', 'login_log', ['created_at'])
    
    op.create_index('ix_api_log_user_id', 'api_log', ['user_id'])
    op.create_index('ix_api_log_method', 'api_log', ['method'])
    op.create_index('ix_api_log_path', 'api_log', ['path'])
    op.create_index('ix_api_log_status_code', 'api_log', ['status_code'])
    op.create_index('ix_api_log_created_at', 'api_log', ['created_at'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_api_log_created_at')
    op.drop_index('ix_api_log_status_code')
    op.drop_index('ix_api_log_path')
    op.drop_index('ix_api_log_method')
    op.drop_index('ix_api_log_user_id')
    
    op.drop_index('ix_login_log_created_at')
    op.drop_index('ix_login_log_success')
    op.drop_index('ix_login_log_username')
    op.drop_index('ix_login_log_user_id')
    
    op.drop_index('ix_audit_log_created_at')
    op.drop_index('ix_audit_log_action')
    op.drop_index('ix_audit_log_resource_id')
    op.drop_index('ix_audit_log_resource_type')
    op.drop_index('ix_audit_log_user_id')
    
    # Drop tables in reverse order
    op.drop_table('api_log')
    op.drop_table('login_log')
    op.drop_table('audit_log')