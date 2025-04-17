# backend/middleware/security_headers.py

from flask import Flask

def setup_security_headers(app: Flask):
    """
    Configure security headers for the Flask app.
    
    Args:
        app: Flask application
    """
    @app.after_request
    def set_security_headers(response):
        # Content Security Policy
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Prevent embedding in iframes (clickjacking protection)
        response.headers['X-Frame-Options'] = 'DENY'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # HSTS (HTTPS only)
        if app.config.get('ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Referrer Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Feature Policy
        response.headers['Feature-Policy'] = "camera 'none'; microphone 'none'; geolocation 'none'"
        
        return response