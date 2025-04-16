#!/bin/bash
# backend/scripts/test_migrations.sh
# Script to test database migrations in CI/CD pipeline

set -e # Exit on error

# Load environment variables
if [ -f .env.test ]; then
    source .env.test
fi

# Set variables
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
TEST_DB_NAME=ruffedlemur_test_migrations_$(date +%s)
TEST_DB_URI="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${TEST_DB_NAME}"

# Function to display a formatted message
function echo_step() {
    echo -e "\n\033[1;36m===> $1\033[0m"
}

# Function to clean up on exit
function cleanup() {
    echo_step "Cleaning up"
    
    # Drop the test database
    PGPASSWORD=${POSTGRES_PASSWORD} psql -U ${POSTGRES_USER} -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME}" postgres
    
    echo "Cleanup complete"
}

# Register the cleanup function to run on exit
trap cleanup EXIT

# Create a test database
echo_step "Creating test database: ${TEST_DB_NAME}"
PGPASSWORD=${POSTGRES_PASSWORD} psql -U ${POSTGRES_USER} -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -c "CREATE DATABASE ${TEST_DB_NAME}" postgres

# Set the test database URI environment variable
export TEST_MIGRATION_DATABASE_URI=${TEST_DB_URI}

# Run the migration tests
echo_step "Running migration tests"
python -m pytest tests/test_migrations.py -v

# If we get here, all tests passed
echo_step "All migration tests passed!"
exit 0