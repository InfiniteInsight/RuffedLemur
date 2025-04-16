# ruffedlemur/app.py
"""
Main application entry point for RuffedLemur.

This module is the entry point for the RuffedLemur application.
"""
import os
from ruffedlemur.core.factory import create_app

# Create Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return {'status': 'ok'}, 200


@app.route('/version', methods=['GET'])
def version():
    """Version endpoint."""
    return {
        'version': '1.0.0',
        'name': 'RuffedLemur Certificate Manager',
    }, 200


if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], host='0.0.0.0')


# ruffedlemur/wsgi.py
"""
WSGI entry point for RuffedLemur.

This module is the WSGI entry point for the RuffedLemur application.
"""
from ruffedlemur.app import app

if __name__ == '__main__':
    app.run()