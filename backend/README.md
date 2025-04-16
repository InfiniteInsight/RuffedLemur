# RuffedLemur Certificate Manager

RuffedLemur is a modern certificate management system, modernized from Netflix's Lemur platform. It provides comprehensive certificate lifecycle management including issuance, tracking, notifications, and reporting capabilities.

I intend to maintain feature parity in addition to implementing new features.

This is my first TypeScript / Javascript project taken on as a challenge for myself.

## Project Overview

This project consists of two main components:

1. **Frontend**: A modern Angular application with TypeScript and Angular Material
2. **Backend**: A Python Flask API that manages certificates and interfaces with various CAs

## Features

- Certificate lifecycle management
- Multiple certificate authority (CA) support
- Role-based access control
- SSO authentication options
- Notifications for expiring certificates
- Reporting and auditing
- Plugin system for extensibility

## Development Setup

### Prerequisites

- Python 3.9+ (Backend)
- Node.js 16+ and npm (Frontend)
- PostgreSQL 14+
- Docker and Docker Compose (optional, but recommended)

### Option 1: Docker Setup (Recommended)

The easiest way to set up the development environment is using Docker:

1. Clone the repository:

   ```bash
   git clone https://github.com/InfiniteInsight/ruffedlemur.git
   cd ruffedlemur
   ```

2. Start the containers:

   ```bash
   docker-compose up -d
   ```

3. Initialize the database:

   ```bash
   docker-compose exec api python -m ruffedlemur.cliApp db init
   docker-compose exec api python -m ruffedlemur.cliApp user create-roles
   docker-compose exec api python -m ruffedlemur.cliApp user create-admin
   ```

4. Access the application:
   - Frontend: <http://localhost:4200>
   - Backend API: <http://localhost:5000>
   - API Documentation: <http://localhost:5000/docs>
   - Database Admin: <http://localhost:5050> (pgAdmin)

### Option 2: Manual Setup

#### Backend Setup

1. Create a Python virtual environment:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set up the database:

   ```bash
   # Create PostgreSQL database
   createdb ruffedlemur
   
   # Initialize the database
   python -m ruffedlemur.cliApp db init
   
   # Create default roles
   python -m ruffedlemur.cliApp user create-roles
   
   # Create admin user
   python -m ruffedlemur.cliApp user create-admin
   ```

4. Start the development server:

   ```bash
   flask run
   ```

#### Frontend Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   ng serve
   ```

3. Access the frontend at <http://localhost:4200>

## Project Structure

### Backend Structure

```
backend/
├── ruffedlemur/
│   ├── api/                  # API layer
│   │   ├── endpoints/        # API endpoints
│   │   ├── errors.py         # Error handling
│   │   └── schemas/          # Request/response schemas
│   ├── core/                 # Core functionality
│   │   ├── extensions.py     # Flask extensions
│   │   ├── factory.py        # Application factory
│   │   └── lemur.conf.py     # Configuration
│   ├── models/               # Database models
│   ├── plugins/              # Plugin system
│   │   ├── sources/          # Certificate sources
│   │   └── destinations/     # Certificate destinations
│   ├── services/             # Business logic
│   ├── utils/                # Utilities
│   ├── app.py                # Application entry point
│   ├── cliApp.py             # CLI commands
│   └── wsgi.py               # WSGI entry point
├── migrations/               # Database migrations
├── scripts/                  # Helper scripts
├── tests/                    # Test suite
├── Dockerfile.dev            # Development Docker config
├── Dockerfile.prod           # Production Docker config
└── requirements.txt          # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/             # Core module
│   │   ├── auth/             # Authentication
│   │   ├── certificates/     # Certificate management
│   │   ├── authorities/      # CA management
│   │   ├── admin/            # Admin features
│   │   ├── shared/           # Shared components
│   │   └── app.module.ts     # Main module
│   ├── assets/               # Static assets
│   ├── environments/         # Environment configs
│   └── main.ts               # Entry point
├── Dockerfile.dev            # Development Docker config
├── Dockerfile.prod           # Production Docker config
└── package.json              # npm dependencies
```

## CLI Commands

RuffedLemur includes a CLI tool for common management tasks:

```bash
# Show available commands
python -m ruffedlemur.cliApp --help

# Database commands
python -m ruffedlemur.cliApp db init
python -m ruffedlemur.cliApp db status

# User management
python -m ruffedlemur.cliApp user create-admin
python -m ruffedlemur.cliApp user create-roles
python -m ruffedlemur.cliApp user reset-password

# Certificate management
python -m ruffedlemur.cliApp cert list-expiring --days 30

# Configuration
python -m ruffedlemur.cliApp config generate
```

## API Documentation

The API documentation is available at `/docs` when running the backend server. It includes all available endpoints, request/response schemas, and authentication requirements.

## Planned new features

Easier integration of new CAs (plugin helper)
Tableau integration (plugin)
Services management (native)
Hardware Security Module / Cloud HSM integration (plugin)
Crawling for certificates (native)
SCEP (native)
SSH Keys (native)
Disaster Recovery (native)
Clustering (native)
Code Signing Cert monitoring (native)
ADCA (plugin)
Grafana and prometheus (plugin)

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
