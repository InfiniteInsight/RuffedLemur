# ruffedlemur/cliApp.py
"""
Command-line interface for RuffedLemur using Typer.

This module provides a command-line interface for managing the RuffedLemur application.
"""
import os
import sys
import uuid
import typer
from typing import Optional, List
from sqlalchemy import text

from ruffedlemur.app import app as flask_app
from ruffedlemur.core.extensions import db
from ruffedlemur.models.userAndRolesModel import User, Role, Permission

# Initialize Typer app
app = typer.Typer(help="RuffedLemur CLI management tool.")
db_app = typer.Typer(help="Database management commands.")
user_app = typer.Typer(help="User management commands.")
cert_app = typer.Typer(help="Certificate management commands.")
config_app = typer.Typer(help="Configuration management commands.")

# Add sub-commands to main app
app.add_typer(db_app, name="db")
app.add_typer(user_app, name="user")
app.add_typer(cert_app, name="cert")
app.add_typer(config_app, name="config")


@db_app.command("init")
def init_db():
    """Initialize the database tables."""
    with flask_app.app_context():
        typer.echo("Initializing database...")
        db.create_all()
        typer.echo("Database initialized.")


@db_app.command("status")
def db_status():
    """Check database connection status."""
    with flask_app.app_context():
        try:
            # Execute simple query
            result = db.session.execute(text('SELECT 1'))
            result.scalar()
            typer.echo("Database connection successful.")
            
            # Check for common tables
            tables = []
            for table_name in ['user', 'role', 'certificate', 'authority']:
                try:
                    result = db.session.execute(text(f"SELECT 1 FROM {table_name} LIMIT 1"))
                    result.scalar()
                    tables.append(table_name)
                except Exception:
                    pass
            
            if tables:
                typer.echo(f"Found tables: {', '.join(tables)}")
            else:
                typer.echo("No expected tables found. Database may need to be initialized.")
            
        except Exception as e:
            typer.echo(f"Database connection failed: {str(e)}")

@db_app.command("make-migration")
def make_migration(
    message: str = typer.Argument(..., help="Migration message"),
    autogenerate: bool = typer.Option(True, "--autogenerate/--no-autogenerate", "-a/-n", help="Autogenerate migration"),
    directory: str = typer.Option("migrations", "--directory", "-d", help="Migration directory")
):
    """Create a new database migration."""
    with flask_app.app_context():
        from ruffedlemur.utils.migrationUtils import create_migration
        
        if create_migration(message=message, autogenerate=autogenerate):
            typer.echo(f"Migration '{message}' created successfully.")
        else:
            typer.echo("Failed to create migration.")
            raise typer.Exit(code=1)


@db_app.command("upgrade")
def upgrade_db(
    revision: str = typer.Option("head", "--revision", "-r", help="Target revision (default: head)"),
    sql: bool = typer.Option(False, "--sql", help="Don't emit SQL to database - dump to standard output instead")
):
    """Upgrade database to a later version."""
    with flask_app.app_context():
        if sql:
            # Just print the SQL
            from flask_migrate import upgrade as flask_upgrade
            flask_upgrade(sql=True, revision=revision)
        else:
            # Apply the migration
            from ruffedlemur.utils.migrationUtils import apply_migrations
            
            if apply_migrations(target=revision):
                typer.echo(f"Database upgraded to {revision}.")
            else:
                typer.echo("Database upgrade failed.")
                raise typer.Exit(code=1)


@db_app.command("downgrade")
def downgrade_db(
    revision: str = typer.Argument(..., help="Target revision"),
    sql: bool = typer.Option(False, "--sql", help="Don't emit SQL to database - dump to standard output instead"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Don't ask for confirmation")
):
    """Revert database to an earlier version."""
    if not yes:
        confirm = typer.confirm(
            "WARNING: Downgrading may result in data loss. Are you sure you want to continue?", 
            default=False
        )
        if not confirm:
            typer.echo("Downgrade cancelled.")
            return
    
    with flask_app.app_context():
        if sql:
            # Just print the SQL
            from flask_migrate import downgrade as flask_downgrade
            flask_downgrade(sql=True, revision=revision)
        else:
            # Revert the migration
            from ruffedlemur.utils.migrationUtils import revert_migrations
            
            if revert_migrations(target=revision):
                typer.echo(f"Database downgraded to {revision}.")
            else:
                typer.echo("Database downgrade failed.")
                raise typer.Exit(code=1)


@db_app.command("current")
def current_revision():
    """Show current database revision."""
    with flask_app.app_context():
        from ruffedlemur.utils.migrationUtils import get_current_revision
        
        revision = get_current_revision()
        if revision:
            typer.echo(f"Current database revision: {revision}")
        else:
            typer.echo("No migrations have been applied.")


@db_app.command("history")
def migration_history(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show verbose output")
):
    """Show migration history."""
    with flask_app.app_context():
        from ruffedlemur.utils.migrationUtils import get_migration_status
        from rich.console import Console
        from rich.table import Table
        
        console = Console()
        
        # Get migration status
        migrations = get_migration_status()
        
        if not migrations:
            typer.echo("No migrations found.")
            return
        
        # Create table
        table = Table(show_header=True, header_style="bold")
        table.add_column("Revision")
        table.add_column("Parent")
        table.add_column("Applied")
        table.add_column("Date")
        table.add_column("Description")
        
        # Add rows
        for migration in migrations:
            applied = "✅😄" if migration.get('applied', False) else "❌🥲"
            
            if verbose:
                description = migration.get('doc', '')
            else:
                description = migration.get('doc', '').split('\n')[0]
            
            table.add_row(
                migration.get('revision', ''),
                migration.get('down_revision', 'None'),
                applied,
                str(migration.get('date', '')),
                description
            )
        
        # Print table
        console.print(table)


@db_app.command("stamp")
def stamp_revision(
    revision: str = typer.Argument(..., help="Revision identifier"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Don't ask for confirmation")
):
    """Set the revision in the database to the specified revision, without running migrations."""
    if not yes:
        confirm = typer.confirm(
            "WARNING: This will set the database version without running migrations. "
            "This can lead to inconsistencies if not used carefully. Continue?", 
            default=False
        )
        if not confirm:
            typer.echo("Operation cancelled.")
            return
    
    with flask_app.app_context():
        from flask_migrate import stamp
        stamp(revision=revision)
        typer.echo(f"Database stamped with revision {revision}.")


@db_app.command("merge")
def merge_migrations(
    revisions: List[str] = typer.Argument(..., help="Revisions to merge"),
    message: str = typer.Option("merge", "--message", "-m", help="Merge message")
):
    """Merge multiple migrations into a single one."""
    with flask_app.app_context():
        from flask_migrate import merge
        merge(revisions=revisions, message=message)
        typer.echo(f"Migrations {', '.join(revisions)} merged successfully.")


@db_app.command("check")
def check_migrations():
    """Check if there are any pending migrations."""
    with flask_app.app_context():
        from ruffedlemur.utils.migrationUtils import get_migration_status
        
        # Get migration status
        migrations = get_migration_status()
        
        # Count unapplied migrations
        pending = [m for m in migrations if not m.get('applied', False)]
        
        if pending:
            typer.echo(f"There are {len(pending)} pending migrations:")
            for migration in pending:
                typer.echo(f"  - {migration.get('revision', '')}: {migration.get('doc', '').split('\n')[0]}")
            raise typer.Exit(code=1)
        else:
            typer.echo("No pending migrations.")
            return


@user_app.command("create-admin")
def create_admin(
    username: str = typer.Option(..., prompt=True, help="Admin username"),
    email: str = typer.Option(..., prompt=True, help="Admin email"),
    password: str = typer.Option(..., prompt=True, hide_input=True, confirmation_prompt=True, help="Admin password")
):
    """Create an admin user with full permissions."""
    with flask_app.app_context():
        typer.echo("Creating admin user...")
        
        # Check if user already exists
        if User.query.filter((User.username == username) | (User.email == email)).first():
            typer.echo("User with that username or email already exists.")
            return
        
        # Create admin role if it doesn't exist
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(
                name='admin',
                description='Administrator role with full access'
            )
            db.session.add(admin_role)
        
        # Create permissions
        resources = ['certificate', 'authority', 'user', 'role', 'notification', 'destination', 'source']
        actions = ['read', 'create', 'update', 'delete']
        
        for resource in resources:
            for action in actions:
                permission_name = f"{resource}:{action}"
                permission = Permission.query.filter_by(name=permission_name).first()
                if not permission:
                    permission = Permission(
                        name=permission_name,
                        description=f"Permission to {action} {resource}s",
                        resource=resource,
                        action=action
                    )
                    db.session.add(permission)
                    admin_role.permissions.append(permission)
        
        # Create admin user
        user = User(
            username=username,
            email=email,
            password=password,
            active=True
        )
        user.roles.append(admin_role)
        db.session.add(user)
        db.session.commit()
        
        typer.echo(f"Admin user {username} created successfully.")


@user_app.command("create-roles")
def create_default_roles():
    """Create default roles with appropriate permissions."""
    with flask_app.app_context():
        typer.echo("Creating default roles...")
        
        # Define default roles
        role_definitions = [
            {
                'name': 'admin',
                'description': 'Administrator role with full access',
                'permissions': []  # All permissions will be added
            },
            {
                'name': 'certificate_manager',
                'description': 'Can manage certificates',
                'permissions': [
                    ('certificate', 'read'),
                    ('certificate', 'create'),
                    ('certificate', 'update'),
                    ('certificate', 'delete'),
                    ('authority', 'read')
                ]
            },
            {
                'name': 'authority_manager',
                'description': 'Can manage certificate authorities',
                'permissions': [
                    ('authority', 'read'),
                    ('authority', 'create'),
                    ('authority', 'update'),
                    ('authority', 'delete'),
                    ('certificate', 'read')
                ]
            },
            {
                'name': 'readonly',
                'description': 'Read-only access to certificates and authorities',
                'permissions': [
                    ('certificate', 'read'),
                    ('authority', 'read')
                ]
            }
        ]
        
        # Create resources and actions first
        resources = ['certificate', 'authority', 'user', 'role', 'notification', 'destination', 'source']
        actions = ['read', 'create', 'update', 'delete']
        
        permissions = {}
        for resource in resources:
            for action in actions:
                permission_name = f"{resource}:{action}"
                permission = Permission.query.filter_by(name=permission_name).first()
                if not permission:
                    permission = Permission(
                        name=permission_name,
                        description=f"Permission to {action} {resource}s",
                        resource=resource,
                        action=action
                    )
                    db.session.add(permission)
                permissions[(resource, action)] = permission
        
        # Create roles
        for role_def in role_definitions:
            role = Role.query.filter_by(name=role_def['name']).first()
            if not role:
                role = Role(
                    name=role_def['name'],
                    description=role_def['description']
                )
                db.session.add(role)
            
            # Add permissions
            if role.name == 'admin':
                # Admin gets all permissions
                for permission in permissions.values():
                    if permission not in role.permissions:
                        role.permissions.append(permission)
            else:
                # Others get specific permissions
                for resource, action in role_def['permissions']:
                    permission = permissions.get((resource, action))
                    if permission and permission not in role.permissions:
                        role.permissions.append(permission)
        
        db.session.commit()
        typer.echo("Default roles created successfully.")


@user_app.command("reset-password")
def reset_password(
    username: str = typer.Option(..., prompt=True, help="Username"),
    password: str = typer.Option(..., prompt=True, hide_input=True, confirmation_prompt=True, help="New password")
):
    """Reset a user's password."""
    with flask_app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            typer.echo(f"User {username} not found.")
            return
        
        user.set_password(password)
        db.session.commit()
        typer.echo(f"Password for {username} reset successfully.")


@config_app.command("generate")
def generate_config(
    output: str = typer.Option("lemur.conf.py", "--output", "-o", help="Output file path")
):
    """Generate a configuration file template."""
    template = """# RuffedLemur configuration file

# Flask settings
SECRET_KEY = 'change-this-to-a-random-string'
DEBUG = False
TESTING = False

# Database settings
SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost:5432/ruffedlemur'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# JWT settings
JWT_SECRET_KEY = 'change-this-to-a-random-string'
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days

# RuffedLemur settings
LEMUR_TOKEN_SECRET = 'change-this-to-a-random-string'
LEMUR_ENCRYPTION_KEYS = ['change-this-to-a-random-string']

# Email settings
LEMUR_EMAIL = 'lemur@example.com'
LEMUR_SECURITY_TEAM_EMAIL = 'security@example.com'

# Certificate settings
DEFAULT_VALIDITY_DAYS = 365
DEFAULT_CA_EXPIRATION_INTERVALS = [90, 60, 30, 15, 7, 3, 1]
DEFAULT_CERT_EXPIRATION_INTERVALS = [30, 15, 7, 3, 1]

# Plugin settings
ACTIVE_PROVIDERS = {
    'certificate': [],
    'notification': [],
    'destination': [],
    'source': [],
    'issuer': [],
}

# SSO Authentication settings
SSO_PROVIDERS = {
    'enabled': False,
    'providers': [
        # {
        #    'name': 'google',
        #    'client_id': 'your-client-id',
        #    'client_secret': 'your-client-secret',
        #    'redirect_uri': 'https://your-lemur-instance/api/v1/auth/google/callback',
        #    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
        #    'token_uri': 'https://oauth2.googleapis.com/token',
        #    'userinfo_uri': 'https://openidconnect.googleapis.com/v1/userinfo',
        # }
    ]
}
"""
    
    with open(output, "w") as f:
        f.write(template)
    
    typer.echo(f"Configuration template generated at {output}")


@cert_app.command("list-expiring")
def list_expiring_certificates(
    days: int = typer.Option(30, "--days", "-d", help="Days until expiration")
):
    """List certificates that will expire within the specified number of days."""
    from ruffedlemur.services.certificateService import get_expiring_certificates
    
    with flask_app.app_context():
        certificates = get_expiring_certificates(days)
        
        if not certificates:
            typer.echo(f"No certificates will expire within the next {days} days.")
            return
        
        typer.echo(f"Certificates expiring within {days} days:")
        for cert in certificates:
            typer.echo(f"- {cert.name} ({cert.cn}): Expires {cert.not_after.strftime('%Y-%m-%d')}")


@app.command("version")
def version():
    """Show RuffedLemur version."""
    typer.echo("RuffedLemur Certificate Manager v1.0.0")


@app.command("shell")
def shell():
    """Open interactive shell with Flask app context."""
    import code
    import readline
    import rlcompleter
    
    # Set up autocomplete
    readline.parse_and_bind("tab: complete")
    
    # Set up context
    context = {
        'app': flask_app,
        'db': db,
        'User': User,
        'Role': Role,
        'Permission': Permission,
    }
    
    with flask_app.app_context():
        code.InteractiveConsole(context).interact(
            banner="RuffedLemur Interactive Shell\n"
                  "App context has been loaded. Available variables:\n"
                  "- app: Flask application\n"
                  "- db: SQLAlchemy database\n"
                  "- User, Role, Permission: Model classes",
            exitmsg="Leaving RuffedLemur shell."
        )


@app.command("run")
def run_server(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host to bind to"),
    port: int = typer.Option(5000, "--port", "-p", help="Port to bind to"),
    debug: bool = typer.Option(False, "--debug", help="Run in debug mode")
):
    """Run the development server."""
    typer.echo(f"Starting RuffedLemur server at {host}:{port} (debug={debug})")
    flask_app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    app()