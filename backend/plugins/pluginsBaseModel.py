# ruffedlemur/plugins/base.py
"""
Base plugin system for ruffedLemur.

This module defines the base plugin classes that all plugins will inherit from.
"""
import abc
from typing import Dict, List, Any, Optional, Type

from flask import current_app


class Plugin(abc.ABC):
    """Base class for all plugins."""
    
    @abc.abstractproperty
    def title(self) -> str:
        """Title of the plugin."""
        pass
    
    @abc.abstractproperty
    def slug(self) -> str:
        """Slug for the plugin, used for configuration."""
        pass
    
    @abc.abstractproperty
    def description(self) -> str:
        """Description of the plugin."""
        pass
    
    @property
    def version(self) -> str:
        """Version of the plugin."""
        return "1.0.0"
    
    @property
    def author(self) -> str:
        """Author of the plugin."""
        return "ruffedLemur Team"
    
    @property
    def author_url(self) -> str:
        """URL of the author."""
        return "https://github.com/InfiniteInsight/RuffedLemur"
    
    @property
    def options(self) -> List[Dict[str, Any]]:
        """List of options for the plugin."""
        return []
    
    def validate_options(self, options: Dict[str, Any]) -> bool:
        """
        Validate the options for the plugin.
        
        Args:
            options: Options to validate
            
        Returns:
            True if the options are valid, False otherwise
        """
        return True


class SourcePlugin(Plugin):
    """Base class for source plugins."""
    
    type = "source"
    
    @abc.abstractmethod
    def get_certificates(self, options: Dict[str, Any], **kwargs) -> List[Dict[str, Any]]:
        """
        Get certificates from the source.
        
        Args:
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            List of certificates
        """
        pass
    
    @abc.abstractmethod
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
        pass


class DestinationPlugin(Plugin):
    """Base class for destination plugins."""
    
    type = "destination"
    
    @abc.abstractmethod
    def upload_certificate(self, certificate: Dict[str, Any], options: Dict[str, Any], **kwargs) -> bool:
        """
        Upload a certificate to the destination.
        
        Args:
            certificate: Certificate to upload
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            True if the upload was successful, False otherwise
        """
        pass
    
    @property
    def requires_key(self) -> bool:
        """Whether the destination requires a private key."""
        return True


class IssuerPlugin(Plugin):
    """Base class for issuer plugins."""
    
    type = "issuer"
    
    @abc.abstractmethod
    def create_certificate(self, csr: str, options: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Create a certificate from a CSR.
        
        Args:
            csr: Certificate signing request
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            Created certificate
        """
        pass
    
    @abc.abstractmethod
    def revoke_certificate(self, certificate: Dict[str, Any], options: Dict[str, Any], **kwargs) -> bool:
        """
        Revoke a certificate.
        
        Args:
            certificate: Certificate to revoke
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            True if the revocation was successful, False otherwise
        """
        pass


class NotificationPlugin(Plugin):
    """Base class for notification plugins."""
    
    type = "notification"
    
    @abc.abstractmethod
    def send_notification(self, notification_type: str, message: str, targets: List[str], options: Dict[str, Any], **kwargs) -> bool:
        """
        Send a notification.
        
        Args:
            notification_type: Type of notification
            message: Notification message
            targets: Notification targets
            options: Plugin options
            **kwargs: Additional arguments
            
        Returns:
            True if the notification was sent successfully, False otherwise
        """
        pass


# Plugin registry
plugins: Dict[str, Type[Plugin]] = {}


def register_plugin(plugin_class: Type[Plugin]) -> Type[Plugin]:
    """
    Register a plugin.
    
    Args:
        plugin_class: Plugin class to register
        
    Returns:
        The plugin class
    """
    instance = plugin_class()
    plugins[instance.slug] = plugin_class
    return plugin_class


def get_plugin(slug: str) -> Optional[Type[Plugin]]:
    """
    Get a plugin by slug.
    
    Args:
        slug: Plugin slug
        
    Returns:
        Plugin class or None
    """
    return plugins.get(slug)


def get_plugins_by_type(plugin_type: str) -> List[Type[Plugin]]:
    """
    Get plugins by type.
    
    Args:
        plugin_type: Plugin type
        
    Returns:
        List of plugin classes
    """
    return [plugin for slug, plugin in plugins.items() if hasattr(plugin, 'type') and plugin.type == plugin_type]


# Plugin initialization
def init_plugins(app):
    """
    Initialize plugins from app configuration.
    
    Args:
        app: Flask application
    """
    # Initialize plugins from config
    active_providers = app.config.get('ACTIVE_PROVIDERS', {})
    
    for plugin_type, plugin_slugs in active_providers.items():
        for slug in plugin_slugs:
            if slug in plugins:
                plugin_class = plugins[slug]
                if hasattr(plugin_class, 'init_app'):
                    plugin_class().init_app(app)
                    current_app.logger.info(f"Initialized {plugin_type} plugin: {slug}")
            else:
                current_app.logger.warning(f"Plugin {slug} not found")


# ruffedlemur/plugins/__init__.py
"""
Plugin initialization for ruffedLemur.
"""
from ruffedlemur.plugins.base import (
    Plugin, SourcePlugin, DestinationPlugin, IssuerPlugin, NotificationPlugin,
    register_plugin, get_plugin, get_plugins_by_type, init_plugins
)

__all__ = [
    'Plugin',
    'SourcePlugin',
    'DestinationPlugin',
    'IssuerPlugin',
    'NotificationPlugin',
    'register_plugin',
    'get_plugin',
    'get_plugins_by_type',
    'init_plugins',
]