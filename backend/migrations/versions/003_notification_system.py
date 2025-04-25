# backend/migrations/versions/003_notification_system.py
"""Add notification system tables

Revision ID: 003_notification_system
Revises: 002_plugin_tables
Create Date: 2025-04-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '003_notification_system'
down_revision = '002_plugin_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create notification_log table to track sent notifications
    op.create_table(
        'notification_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('notification.id')),
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id')),
        sa.Column('status', sa.String(16), nullable=False),  # 'success', 'failed', 'pending'
        sa.Column('message', sa.Text()),
        sa.Column('error', sa.Text()),
        sa.Column('sent_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create notification_schedule table to schedule future notifications
    op.create_table(
        'notification_schedule',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('notification.id')),
        sa.Column('certificate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('certificate.id')),
        sa.Column('scheduled_for', sa.DateTime(), nullable=False),
        sa.Column('trigger', sa.String(32), nullable=False),  # 'expiration', 'issuance', 'renewal', etc.
        sa.Column('days_before', sa.Integer()),  # For expiration notifications
        sa.Column('status', sa.String(16), default='pending'),  # 'pending', 'sent', 'failed', 'cancelled'
        sa.Column('options', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create notification_template table for reusable notification templates
    op.create_table(
        'notification_template',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('subject', sa.String(255)),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('html_body', sa.Text()),
        sa.Column('trigger', sa.String(32), nullable=False),  # 'expiration', 'issuance', 'renewal', etc.
        sa.Column('days_before', sa.ARRAY(sa.Integer())),  # [30, 15, 7, 3, 1] for expiration notifications
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create notification_template_notification association table
    op.create_table(
        'notification_template_associations',
        sa.Column('notification_template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('notification_template.id'), primary_key=True),
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('notification.id'), primary_key=True)
    )
    
    # Add columns to existing notification table
    op.add_column('notification', sa.Column('notification_type', sa.String(32)))  # 'email', 'slack', 'webhook', etc.
    op.add_column('notification', sa.Column('targets', postgresql.ARRAY(sa.String(128))))  # List of email addresses, channels, etc.
    
    # Create indexes
    op.create_index('ix_notification_log_sent_at', 'notification_log', ['sent_at'])
    op.create_index('ix_notification_schedule_scheduled_for', 'notification_schedule', ['scheduled_for'])
    op.create_index('ix_notification_schedule_status', 'notification_schedule', ['status'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_notification_schedule_status')
    op.drop_index('ix_notification_schedule_scheduled_for')
    op.drop_index('ix_notification_log_sent_at')
    
    # Drop columns from notification table
    op.drop_column('notification', 'targets')
    op.drop_column('notification', 'notification_type')
    
    # Drop tables in reverse order
    op.drop_table('notification_template_associations')
    op.drop_table('notification_template')
    op.drop_table('notification_schedule')
    op.drop_table('notification_log')