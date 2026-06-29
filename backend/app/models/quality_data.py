from app.models import db
from datetime import datetime
import json

class QualityData(db.Model):
    __tablename__ = 'quality_data'
    
    id = db.Column(db.Integer, primary_key=True)
    features = db.Column(db.JSON, nullable=False)
    label = db.Column(db.Float, nullable=True)
    batch_id = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'features': self.features,
            'label': self.label,
            'batch_id': self.batch_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }