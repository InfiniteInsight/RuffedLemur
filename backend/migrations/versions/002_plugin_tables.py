# backend/migrations/versions/002_plugin_tables.py
"""Add plugin-related tables

Revision ID: 002_plugin_tables
Revises: 001_initial_schema
Create Date: 2023-09-01 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '002_plugin_tables'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create source table for certificate sources
    op.create_table(
        'source',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('label', sa.String(128), unique=True, nullable=False),
        sa.Column('plugin_name', sa.String(64), nullable=False),
        sa.Column('options', postgresql.JSONB),
        sa.Column('description', sa.Text()),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create destination table for certificate destinations
    op.create_table(
        'destination',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('label', sa.String(128), unique=True, nullable=False),
        sa.Column('plugin_name', sa.String(64), nullable=False),
        sa.Column('options', postgresql.JSONB),
        sa.Column('description', sa.Text()),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create notification table for certificate notifications
    op.create_table(
        'notification',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('label', sa.String(128), unique=True, nullable=False),
        sa.Column('plugin_name', sa.String(64), nullable=False),
        sa.Column('options', postgresql.JSONB),
        sa.Column('description', sa.Text()),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create plugin table to store plugin configurations
    op.create_table(
        'plugin',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(128), unique=True, nullable=False),
        sa.Column('slug', sa.String(64), unique=True, nullable=False),
        sa.Column('type', sa.String(32), nullable=False),
        sa.Column('version', sa.String(16)),
        sa.Column('author', sa.String(128)),
        sa.Column('enabled', sa.Boolean(), default=True),
        sa.Column('options_schema', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now())
    )


def downgrade():
    # Drop tables in reverse order
    op.drop_table('plugin')
    op.drop_table('notification')
    op.drop_table('destination')
    op.drop_table('source')