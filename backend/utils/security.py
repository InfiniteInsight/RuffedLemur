# backend/utils/security.py

import secrets
import hashlib
import time
from flask import current_app, session

def generate_csrf_token():
    """
    Generate a secure CSRF token.
    
    Returns:
        Secure CSRF token
    """
    # Generate a random token
    random_bytes = secrets.token_bytes(32)
    
    # Create a unique token with timestamp
    timestamp = str(int(time.time()))
    token_input = random_bytes + timestamp.encode('utf-8')
    
    # Hash the token
    token_hash = hashlib.sha256(token_input).hexdigest()
    
    # Store the token in the session
    session['csrf_token'] = token_hash
    session['csrf_token_time'] = timestamp
    
    return token_hash

def validate_csrf_token(token):
    """
    Validate a CSRF token.
    
    Args:
        token: CSRF token to validate
        
    Returns:
        True if valid, False otherwise
    """
    # Get stored token
    stored_token = session.get('csrf_token')
    token_time = session.get('csrf_token_time')
    
    if not stored_token or not token_time:
        return False
    
    # Check if token has expired (valid for 1 hour)
    timestamp = int(token_time)
    current_time = int(time.time())
    
    if current_time - timestamp > 3600:  # 1 hour expiration
        # Clear expired token
        session.pop('csrf_token', None)
        session.pop('csrf_token_time', None)
        return False
    
    # Compare tokens
    return secrets.compare_digest(stored_token, token)