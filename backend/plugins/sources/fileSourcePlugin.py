# ruffedlemur/plugins/sources/fileSourcePlugin.py
"""
File source plugin for RuffedLemur.

This plugin allows importing certificates from files on the filesystem.
"""
from typing import Dict, Any, List, Optional
import os
import glob
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

from ruffedlemur.plugins import SourcePlugin, register_plugin
from ruffedlemur.utils.cryptoUtils import parse_certificate


@register_plugin
class FileSource(SourcePlugin):
    """File source plugin for importing certificates from files."""
    
    @property
    def title(self) -> str:
        """Title of the plugin."""
        return "File Source"
    
    @property
    def slug(self) -> str:
        """Slug for the plugin."""
        return "file-source"
    
    @property
    def description(self) -> str:
        """Description of the plugin."""
        return "Import certificates from files on the filesystem"
    
    @property
    def options(self) -> List[Dict[str, Any]]:
        """Options for the plugin."""
        return [
            {
                'name': 'path',
                'type': 'str',
                'required': True,
                'validation': r'^/.*$',
                'helpText': 'Path to certificates directory'
            },
            {
                'name': 'pattern',
                'type': 'str',
                'required': False,
                'default': '*.pem',
                'helpText': 'File pattern to match (e.g., *.pem, *.crt)'
            },
            {
                'name': 'include_chain',
                'type': 'bool',
                'required': False,
                'default': True,
                'helpText': 'Include certificate chain if available'
            },
            {
                'name': 'include_key',
                'type': 'bool',
                'required': False,
                'default': False,
                'helpText': 'Include private key if available'
            }
        ]
    
    def get_certificates(self, options: Dict[str, Any], **kwargs) -> List[Dict[str, Any]]:
        """
        Get certificates from the source.
        
        Args:
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            List of certificates
        """
        path = options.get('path', '/tmp/certificates')
        pattern = options.get('pattern', '*.pem')
        include_chain = options.get('include_chain', True)
        include_key = options.get('include_key', False)
        
        # Find certificate files
        cert_files = glob.glob(os.path.join(path, pattern))
        
        certificates = []
        for cert_file in cert_files:
            try:
                # Read certificate file
                with open(cert_file, 'r') as f:
                    cert_data = f.read()
                
                # Parse certificate
                certificate_data = parse_certificate(cert_data)
                if not certificate_data:
                    continue
                
                # Prepare certificate
                certificate = {
                    'name': os.path.basename(cert_file).replace('.pem', ''),
                    'body': cert_data,
                    'chain': None,
                    'private_key': None,
                    **certificate_data
                }
                
                # Look for chain file
                if include_chain:
                    chain_file = cert_file.replace('.pem', '.chain.pem')
                    if os.path.exists(chain_file):
                        with open(chain_file, 'r') as f:
                            certificate['chain'] = f.read()
                
                # Look for private key file
                if include_key:
                    key_file = cert_file.replace('.pem', '.key.pem')
                    if os.path.exists(key_file):
                        with open(key_file, 'r') as f:
                            certificate['private_key'] = f.read()
                
                certificates.append(certificate)
            
            except Exception as e:
                continue
        
        return certificates
    
    def get_certificate_by_name(self, certificate_name: str, options: Dict[str, Any], **kwargs) -> Optional[Dict[str, Any]]:
        """
        Get a certificate by name from the source.
        
        Args:
            certificate_name: Name of the certificate
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            Certificate or None
        """
        path = options.get('path', '/tmp/certificates')
        pattern = options.get('pattern', '*.pem')
        include_chain = options.get('include_chain', True)
        include_key = options.get('include_key', False)
        
        # Find matching certificate file
        cert_file = None
        
        # Try exact match first
        for ext in ['.pem', '.crt', '.cer']:
            potential_file = os.path.join(path, f"{certificate_name}{ext}")
            if os.path.exists(potential_file):
                cert_file = potential_file
                break
        
        # If no exact match, try pattern matching
        if not cert_file:
            cert_files = glob.glob(os.path.join(path, pattern))
            for file in cert_files:
                if os.path.basename(file).replace('.pem', '') == certificate_name:
                    cert_file = file
                    break
        
        if not cert_file:
            return None
        
        try:
            # Read certificate file
            with open(cert_file, 'r') as f:
                cert_data = f.read()
            
            # Parse certificate
            certificate_data = parse_certificate(cert_data)
            if not certificate_data:
                return None
            
            # Prepare certificate
            certificate = {
                'name': certificate_name,
                'body': cert_data,
                'chain': None,
                'private_key': None,
                **certificate_data
            }
            
            # Look for chain file
            if include_chain:
                chain_file = cert_file.replace('.pem', '.chain.pem')
                if os.path.exists(chain_file):
                    with open(chain_file, 'r') as f:
                        certificate['chain'] = f.read()
            
            # Look for private key file
            if include_key:
                key_file = cert_file.replace('.pem', '.key.pem')
                if os.path.exists(key_file):
                    with open(key_file, 'r') as f:
                        certificate['private_key'] = f.read()
            
            return certificate
        
        except Exception as e:
            return None