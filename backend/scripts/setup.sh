#!/bin/bash
# backend/scripts/setup.sh
# Script to set up the development environment

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Activated virtual environment"
fi

# Function to display a formatted message
function echo_step() {
    echo -e "\n\033[1;36m===> $1\033[0m"
}

# Function to check if a command exists
function command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python version
echo_step "Checking Python version"
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    echo "Found Python $PYTHON_VERSION"
    if [[ "$PYTHON_VERSION" < "3.9" ]]; then
        echo "Warning: RuffedLemur recommends Python 3.9 or newer"
    fi
else
    echo "Error: Python 3 not found"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo_step "Creating virtual environment"
    python3 -m venv venv
    source venv/bin/activate
    echo "Created and activated virtual environment"
fi

# Install Python dependencies
echo_step "Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt

# Wait for database to be ready
echo_step "Waiting for database connection"
if command_exists docker && docker-compose ps | grep -q db; then
    ./scripts/wait-for-it.sh ${DB_HOST:-localhost}:${DB_PORT:-5432} -t 60
    echo "Database is ready"
else
    echo "Skipping database check, make sure your database is running"
fi

# Initialize database
echo_step "Initializing database"
python -m ruffedlemur.cliApp db init
echo "Database initialized"

# Create or update database schema
echo_step "Running database migrations"
flask db upgrade
echo "Database migrations complete"

# Create default roles
echo_step "Creating default roles"
python -m ruffedlemur.cliApp user create-roles
echo "Default roles created"

# Check if admin user exists
echo_step "Checking for admin user"
ADMIN_EXISTS=$(python -c "from ruffedlemur.models.userAndRolesModel import User; print(User.query.filter_by(username='admin').first() is not None)" 2>/dev/null || echo "False")

if [ "$ADMIN_EXISTS" != "True" ]; then
    echo_step "Creating admin user"
    python -m ruffedlemur.cliApp user create-admin --username admin --email admin@ruffedlemur.com
    echo "Admin user created"
else
    echo "Admin user already exists"
fi

# Generate a sample configuration file
if [ ! -f "lemur.conf.py" ]; then
    echo_step "Generating configuration file"
    python -m ruffedlemur.cliApp config generate
    echo "Configuration file generated at lemur.conf.py"
fi

echo_step "Setup complete!"
echo "You can now run the application with:"
echo "  flask run"
echo "Or using Docker Compose:"
echo "  docker-compose up"