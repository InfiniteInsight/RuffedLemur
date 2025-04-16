# backend/tests/test_migrations.py
"""
Tests for database migrations.

This module provides tests for database migrations.
"""
import os
import pytest
import tempfile
import subprocess
from pathlib import Path
from contextlib import contextmanager
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.engine import Engine

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade, downgrade
from alembic.migration import MigrationContext

# Use a temporary database for migration tests
TEST_DATABASE_URI = os.environ.get(
    'TEST_MIGRATION_DATABASE_URI', 
    'postgresql://postgres:postgres@localhost:5432/ruffedlemur_test_migrations'
)


@contextmanager
def temporary_migration_directory():
    """
    Create a temporary directory for migrations.
    
    Yields:
        Path to the temporary directory
    """
    temp_dir = tempfile.mkdtemp()
    try:
        yield Path(temp_dir)
    finally:
        # Clean up
        import shutil
        shutil.rmtree(temp_dir)


def create_test_app(database_uri=None):
    """
    Create a Flask app for testing migrations.
    
    Args:
        database_uri: Optional database URI
        
    Returns:
        Flask app, SQLAlchemy instance, and Migrate instance
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri or TEST_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db = SQLAlchemy(app)
    migrate = Migrate(app, db)
    
    return app, db, migrate


def is_database_empty(engine):
    """
    Check if the database is empty.
    
    Args:
        engine: SQLAlchemy engine
        
    Returns:
        True if the database has no tables, False otherwise
    """
    inspector = sa.inspect(engine)
    return len(inspector.get_table_names()) == 0


def get_current_revision(engine):
    """
    Get the current migration revision.
    
    Args:
        engine: SQLAlchemy engine
        
    Returns:
        Current revision or None if no migrations have been applied
    """
    with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        return context.get_current_revision()


def clean_database(engine):
    """
    Clean the database by dropping all tables.
    
    Args:
        engine: SQLAlchemy engine
    """
    # Get metadata
    metadata = sa.MetaData()
    metadata.reflect(bind=engine)
    
    # Drop all tables
    metadata.drop_all(bind=engine)
    
    # Drop alembic_version table if it exists
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()


# Fixture for the test app and database
@pytest.fixture(scope='module')
def test_db():
    """
    Fixture for the test database.
    
    Yields:
        Flask app, SQLAlchemy instance, Migrate instance, and database engine
    """
    app, db, migrate = create_test_app()
    
    # Clean database before tests
    clean_database(db.engine)
    
    yield app, db, migrate, db.engine
    
    # Clean up after tests
    clean_database(db.engine)


def test_migrations_initial_state(test_db):
    """
    Test that the database starts in a clean state.
    
    Args:
        test_db: Fixture for the test database
    """
    _, _, _, engine = test_db
    
    # Ensure the database is empty
    assert is_database_empty(engine), "Database should be empty before running migration tests"
    
    # Ensure no migrations have been applied
    assert get_current_revision(engine) is None, "No migrations should be applied yet"


def test_migrations_run_all(test_db):
    """
    Test that all migrations can be applied successfully.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Apply all migrations
        upgrade()
        
        # Check that migrations have been applied
        assert get_current_revision(engine) is not None, "Migrations should be applied"
        
        # Check that the database has tables
        assert not is_database_empty(engine), "Database should have tables after migrations"


def test_migrations_downgrade(test_db):
    """
    Test that migrations can be downgraded successfully.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Apply all migrations
        upgrade()
        
        # Get the current revision
        revision = get_current_revision(engine)
        assert revision is not None, "Migrations should be applied"
        
        # Downgrade one step
        downgrade('-1')
        
        # Check that the database was downgraded
        assert get_current_revision(engine) != revision, "Database should be downgraded"
        
        # Upgrade again
        upgrade()
        
        # Check that the database was upgraded
        assert get_current_revision(engine) == revision, "Database should be upgraded again"


def test_migrations_incremental(test_db):
    """
    Test that migrations can be applied incrementally.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Get ordered list of revisions (excluding branches)
        from flask_migrate import command
        from alembic.script import ScriptDirectory
        config = command.get_config()
        script = ScriptDirectory.from_config(config)
        revisions = []
        
        for sc in script.walk_revisions():
            if sc.is_branch_point:
                continue
            revisions.append(sc.revision)
        
        # Apply migrations one by one
        revisions.reverse()  # Need to reverse as walk_revisions walks from newest to oldest
        
        for rev in revisions:
            upgrade(rev)
            assert get_current_revision(engine) == rev, f"Migration to {rev} failed"


def test_migrations_integrity(test_db):
    """
    Test the integrity of the migrations chain.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Apply all migrations
        upgrade()
        
        # Get the revision after applying all migrations
        final_revision = get_current_revision(engine)
        
        # Downgrade to base
        downgrade('base')
        
        # Check that the database is empty (except for alembic_version table)
        inspector = sa.inspect(engine)
        tables = inspector.get_table_names()
        assert len(tables) <= 1, f"Database should be empty, found tables: {tables}"
        
        # Upgrade to the final revision again
        upgrade(final_revision)
        
        # Check that we're at the same revision
        assert get_current_revision(engine) == final_revision, "Should be at the same revision after downgrade and upgrade"


# backend/tests/test_migrations.py (continued)

def test_migrations_data_integrity(test_db):
    """
    Test that migrations preserve data integrity.
    
    Args:
        test_db: Fixture for the test database
    """
    app, db, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Apply all migrations
        upgrade()
        
        # Insert test data
        # We need to import the models here after the migrations have been applied
        from ruffedlemur.models.userAndRolesModel import User, Role, Permission
        
        # Create a test user
        test_user = User(
            username="test_migration_user",
            email="test_migration@example.com",
            active=True
        )
        test_user.set_password("password123")
        
        # Create a test role
        test_role = Role(
            name="test_migration_role",
            description="Role for testing migrations"
        )
        
        # Create a test permission
        test_permission = Permission(
            name="test:read",
            description="Permission for testing migrations",
            resource="test",
            action="read"
        )
        
        # Add permission to role
        test_role.permissions.append(test_permission)
        
        # Add role to user
        test_user.roles.append(test_role)
        
        # Save to database
        db.session.add(test_user)
        db.session.add(test_role)
        db.session.add(test_permission)
        db.session.commit()
        
        # Get user ID for later
        user_id = test_user.id
        
        # Now downgrade one step and then upgrade again
        # Get the current revision
        revision = get_current_revision(engine)
        
        # Downgrade one step
        downgrade('-1')
        
        # Upgrade again
        upgrade()
        
        # Check that our data is still there
        user = User.query.filter_by(username="test_migration_user").first()
        assert user is not None, "User should still exist after downgrade and upgrade"
        assert user.id == user_id, "User ID should be preserved"
        assert len(user.roles) > 0, "User roles should be preserved"
        
        role = Role.query.filter_by(name="test_migration_role").first()
        assert role is not None, "Role should still exist"
        assert len(role.permissions) > 0, "Role permissions should be preserved"


def test_migrations_performance(test_db):
    """
    Test the performance of migrations.
    
    Args:
        test_db: Fixture for the test database
    """
    app, db, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Measure time to apply all migrations
        import time
        start_time = time.time()
        
        # Apply all migrations
        upgrade()
        
        end_time = time.time()
        
        # Check that migrations didn't take too long
        # This is a very simple check - in real life, you might want to be more sophisticated
        elapsed_time = end_time - start_time
        
        # Log the time for informational purposes
        print(f"Migration time: {elapsed_time:.2f} seconds")
        
        # Assert that migrations complete in a reasonable time
        # This threshold might need to be adjusted based on your specific migrations
        assert elapsed_time < 30, f"Migrations took too long: {elapsed_time:.2f} seconds"


def test_migrations_custom_sql(test_db):
    """
    Test that custom SQL in migrations works correctly.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Apply all migrations
        upgrade()
        
        # Execute some custom SQL to test that the migrations created the expected schema
        with engine.connect() as conn:
            # Check that the user table has the expected columns
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user'
            """))
            columns = [row[0] for row in result]
            
            assert 'id' in columns, "User table should have an id column"
            assert 'username' in columns, "User table should have a username column"
            assert 'email' in columns, "User table should have an email column"
            assert 'password_hash' in columns, "User table should have a password_hash column"
            
            # Check that roles_permissions table exists with the right foreign keys
            result = conn.execute(text("""
                SELECT 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_name='roles_permissions'
            """))
            foreign_keys = {row[0]: (row[1], row[2]) for row in result}
            
            assert 'role_id' in foreign_keys, "roles_permissions should have a role_id foreign key"
            assert 'permission_id' in foreign_keys, "roles_permissions should have a permission_id foreign key"
            assert foreign_keys['role_id'][0] == 'role', "role_id should reference the role table"
            assert foreign_keys['permission_id'][0] == 'permission', "permission_id should reference the permission table"


def test_migrations_rollback_safety(test_db):
    """
    Test that all migrations can be safely rolled back.
    
    Args:
        test_db: Fixture for the test database
    """
    app, _, _, engine = test_db
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Get ordered list of revisions
        from flask_migrate import command
        from alembic.script import ScriptDirectory
        config = command.get_config()
        script = ScriptDirectory.from_config(config)
        revisions = []
        
        for sc in script.walk_revisions(base='base', head='head'):
            revisions.append(sc.revision)
        
        # Apply migrations one by one and attempt to roll them back
        revisions.reverse()  # Need to reverse as walk_revisions walks from newest to oldest
        
        for i, rev in enumerate(revisions):
            # Apply migration
            upgrade(rev)
            
            # Check that it was applied
            current_rev = get_current_revision(engine)
            assert current_rev == rev, f"Failed to apply migration {rev}"
            
            # If this is not the first migration, try to roll it back
            if i > 0:
                previous_rev = revisions[i-1]
                
                # Downgrade to previous revision
                downgrade(previous_rev)
                
                # Check that downgrade worked
                current_rev = get_current_revision(engine)
                assert current_rev == previous_rev, f"Failed to downgrade from {rev} to {previous_rev}"
                
                # Upgrade back
                upgrade(rev)


# Run the tests directly if this file is executed
if __name__ == "__main__":
    app, db, migrate, engine = create_test_app()
    
    with app.app_context():
        # Clean database
        clean_database(engine)
        
        # Run tests
        test_migrations_initial_state((app, db, migrate, engine))
        test_migrations_run_all((app, db, migrate, engine))
        test_migrations_downgrade((app, db, migrate, engine))
        test_migrations_incremental((app, db, migrate, engine))
        test_migrations_integrity((app, db, migrate, engine))
        test_migrations_data_integrity((app, db, migrate, engine))
        test_migrations_performance((app, db, migrate, engine))
        test_migrations_custom_sql((app, db, migrate, engine))
        test_migrations_rollback_safety((app, db, migrate, engine))
        
        print("All migration tests passed!")