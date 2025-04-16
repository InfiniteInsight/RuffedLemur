# ruffedlemur/models/base.py
"""
Base model for all models in the application.

This module defines the BaseModel class that all models will inherit from.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, String, Boolean
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import UUID

from ruffedlemur.core.extensions import db


class BaseModel(db.Model):
    """
    Base model for all models in the application.
    
    This class includes common fields and methods that all models will inherit.
    """
    
    __abstract__ = True
    
    # Common columns
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    
    @declared_attr
    def __tablename__(cls):
        """
        Generate table name automatically based on class name.
        
        Returns:
            Table name
        """
        return cls.__name__.lower()
    
    def save(self):
        """
        Save the model instance to the database.
        
        Returns:
            Self
        """
        db.session.add(self)
        db.session.commit()
        return self
    
    def delete(self):
        """
        Delete the model instance from the database.
        
        Returns:
            Self
        """
        db.session.delete(self)
        db.session.commit()
        return self
    
    def update(self, **kwargs):
        """
        Update the model instance with the given keyword arguments.
        
        Args:
            **kwargs: Keyword arguments to update the model with
            
        Returns:
            Self
        """
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        db.session.commit()
        return self
    
    @classmethod
    def get_by_id(cls, id):
        """
        Get a model instance by ID.
        
        Args:
            id: ID of the model instance
            
        Returns:
            Model instance or None
        """
        return cls.query.get(id)
    
    @classmethod
    def get_all(cls, **kwargs):
        """
        Get all model instances matching the given criteria.
        
        Args:
            **kwargs: Keyword arguments to filter by
            
        Returns:
            List of model instances
        """
        return cls.query.filter_by(**kwargs).all()
    
    @classmethod
    def get_or_create(cls, defaults=None, **kwargs):
        """
        Get or create a model instance.
        
        Args:
            defaults: Default values to use when creating a new instance
            **kwargs: Keyword arguments to filter by
            
        Returns:
            Tuple of (instance, created) where created is a boolean
        """
        instance = cls.query.filter_by(**kwargs).first()
        if instance:
            return instance, False
        
        params = dict((k, v) for k, v in kwargs.items())
        params.update(defaults or {})
        instance = cls(**params)
        db.session.add(instance)
        db.session.commit()
        return instance, True
    
    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        
        Returns:
            Dictionary representation of the model instance
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}