# backend/utils/rate_limit.py

import time
from flask import request, jsonify
from functools import wraps
import redis
import hashlib

# Initialize Redis client
redis_client = redis.Redis(
    host='localhost', 
    port=6379, 
    db=0,
    decode_responses=True
)

def get_rate_limit_key(prefix):
    """
    Generate a rate limit key based on client IP.
    
    Args:
        prefix: Key prefix
        
    Returns:
        Rate limit key
    """
    # Get client IP
    ip = request.remote_addr
    
    # Hash IP for privacy
    ip_hash = hashlib.md5(ip.encode()).hexdigest()
    
    return f"{prefix}:{ip_hash}"

def rate_limit(limit=5, period=60, message="Too many requests. Please try again later."):
    """
    Rate limit decorator.
    
    Args:
        limit: Maximum number of requests within the period
        period: Time period in seconds
        message: Error message to return
        
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Generate unique key for this endpoint and IP
            key = get_rate_limit_key(f.__name__)
            
            # Increment request count
            current = redis_client.incr(key)
            
            # Set expiry for key on first request
            if current == 1:
                redis_client.expire(key, period)
            
            # Check if limit exceeded
            if current > limit:
                return jsonify({
                    'status': 'error',
                    'message': message,
                    'code': 429
                }), 429
            
            return f(*args, **kwargs)
        return wrapped
    return decorator