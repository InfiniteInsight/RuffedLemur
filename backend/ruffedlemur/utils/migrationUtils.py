# backend/ruffedlemur/utils/migrationUtils.py
"""
Utilities for database migrations.

This module provides utilities for managing database migrations.
"""
from typing import List, Dict, Any, Optional
import logging
import subprocess
import os
import sys
from pathlib import Path

from flask import current_app
from flask_migrate import upgrade, downgrade, migrate, init, current

logger = logging.getLogger(__name__)


def init_migrations(directory: str = 'migrations') -> bool:
    """
    Initialize the migrations directory.
    
    Args:
        directory: Path to the migrations directory
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Check if migrations directory already exists
        if os.path.exists(directory):
            logger.info(f"Migrations directory '{directory}' already exists.")
            return True
        
        # Initialize migrations
        logger.info(f"Initializing migrations directory '{directory}'...")
        init(directory=directory)
        logger.info("Migrations directory initialized successfully.")
        return True
    
    except Exception as e:
        logger.error(f"Failed to initialize migrations: {str(e)}")
        return False


def create_migration(message: str, autogenerate: bool = True) -> bool:
    """
    Create a new migration.
    
    Args:
        message: Migration message
        autogenerate: Whether to autogenerate the migration
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create migration
        logger.info(f"Creating migration: '{message}'...")
        migrate(message=message, autogenerate=autogenerate)
        logger.info("Migration created successfully.")
        return True
    
    except Exception as e:
        logger.error(f"Failed to create migration: {str(e)}")
        return False


def apply_migrations(target: str = 'head') -> bool:
    """
    Apply migrations up to the specified target.
    
    Args:
        target: Migration target (revision identifier or 'head')
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Apply migrations
        logger.info(f"Applying migrations to '{target}'...")
        upgrade(target=target)
        logger.info("Migrations applied successfully.")
        return True
    
    except Exception as e:
        logger.error(f"Failed to apply migrations: {str(e)}")
        return False


def revert_migrations(target: str) -> bool:
    """
    Revert migrations back to the specified target.
    
    Args:
        target: Migration target (revision identifier or '-1' for previous)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Revert migrations
        logger.info(f"Reverting migrations to '{target}'...")
        downgrade(target=target)
        logger.info("Migrations reverted successfully.")
        return True
    
    except Exception as e:
        logger.error(f"Failed to revert migrations: {str(e)}")
        return False


def get_current_revision() -> Optional[str]:
    """
    Get the current migration revision.
    
    Returns:
        Current revision or None if no migrations have been applied
    """
    try:
        # Get current revision
        revision = current()
        if revision:
            logger.info(f"Current migration revision: {revision}")
            return revision
        else:
            logger.info("No migrations have been applied.")
            return None
    
    except Exception as e:
        logger.error(f"Failed to get current revision: {str(e)}")
        return None


def get_migration_status() -> List[Dict[str, Any]]:
    """
    Get the status of all migrations.
    
    Returns:
        List of migration status dictionaries
    """
    try:
        # Import needed here to avoid circular imports
        from flask_migrate import get_config
        from alembic.script import ScriptDirectory
        from alembic.runtime.migration import MigrationContext
        
        # Get alembic config
        config = get_config()
        script = ScriptDirectory.from_config(config)
        
        # Get current revision
        with current_app.extensions['migrate'].db.engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
        
        # Get all revisions and build status
        revisions = []
        for sc in script.walk_revisions():
            revisions.append({
                'revision': sc.revision,
                'down_revision': sc.down_revision,
                'doc': sc.doc,
                'applied': sc.revision == current_rev or script.get_revision(sc.revision).is_applied(context),
                'date': sc.date
            })
        
        return revisions
    
    except Exception as e:
        logger.error(f"Failed to get migration status: {str(e)}")
        return []


def run_migration_command(command: List[str]) -> bool:
    """
    Run a migration command using subprocess.
    
    Args:
        command: Command and arguments
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Run command
        logger.info(f"Running migration command: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("Migration command completed successfully.")
            logger.debug(result.stdout)
            return True
        else:
            logger.error(f"Migration command failed with code {result.returncode}")
            logger.error(result.stderr)
            return False
    
    except Exception as e:
        logger.error(f"Failed to run migration command: {str(e)}")
        return False