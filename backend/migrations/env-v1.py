# backend/migrations/env.py
from __future__ import with_statement

import logging
from logging.config import fileConfig

from alembic import context
from flask import current_app
from sqlalchemy import engine_from_config, pool

#  Alembic Config object, provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')


def get_engine():
    try:
        # This works with Flask-SQLAlchemy < 3.0
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, KeyError):
        # This works with Flask-SQLAlchemy >= 3.0
        return current_app.extensions['migrate'].db.engine


def get_metadata():
    # Import all models here to ensure they are registered with SQLAlchemy
    from ruffedlemur.models.userAndRolesModel import User, Role, Permission
    from ruffedlemur.models.certificateModel import Certificate
    from ruffedlemur.models.authorityModel import Authority
    
    try:
        # This works with Flask-SQLAlchemy < 3.0
        return current_app.extensions['migrate'].db.metadata
    except (TypeError, KeyError):
        # This works with Flask-SQLAlchemy >= 3.0
        return current_app.extensions['migrate'].db.metadata


# Add the context information to the config object
config.set_main_option('sqlalchemy.url',
                       current_app.config.get('SQLALCHEMY_DATABASE_URI'))
target_metadata = get_metadata()

# Other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # this callback is used to prevent an auto-migration from being generated
    # when there are no changes to the schema
    # reference: http://alembic.zzzcomputing.com/en/latest/cookbook.html
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')

    engine = get_engine()

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            process_revision_directives=process_revision_directives,
            **current_app.extensions['migrate'].configure_args
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()