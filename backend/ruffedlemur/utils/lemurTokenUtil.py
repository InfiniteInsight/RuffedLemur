"""
Lemur Token generator for lemur_conf.py

This module relieves the burden of creating the Lemur token from the user
"""


import secrets
import string

def generate_lemur_token():

    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits + "~!@#$%^&*()_+"
    secret_key = ''.join(secrets.choice(chars) for x in range(24))

    return secret_key


