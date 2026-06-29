from app.models import db
from datetime import datetime

class MaterialBatch(db.Model):
    __tablename__ = 'material_batch'
    
    id = db.Column(db.Integer, primary_key=True)
    material_batch_id = db.Column(db.String(50), unique=True, nullable=False)
    supplier = db.Column(db.String(100))
    material_type = db.Column(db.String(50))
    carbon_content = db.Column(db.Float)
    silicon_content = db.Column(db.Float)
    manganese_content = db.Column(db.Float)
    phosphorus_content = db.Column(db.Float)
    sulfur_content = db.Column(db.Float)
    raw_hardness = db.Column(db.Float)
    tensile_strength = db.Column(db.Float)
    inspection_date = db.Column(db.DateTime)
    material_status = db.Column(db.String(20))
    risk_reason = db.Column(db.String(200))
    storage_temperature = db.Column(db.Float)
    storage_humidity = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    quality_labels = db.relationship('QualityLabel', backref='material_batch', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'material_batch_id': self.material_batch_id,
            'supplier': self.supplier,
            'material_type': self.material_type,
            'carbon_content': self.carbon_content,
            'silicon_content': self.silicon_content,
            'manganese_content': self.manganese_content,
            'phosphorus_content': self.phosphorus_content,
            'sulfur_content': self.sulfur_content,
            'raw_hardness': self.raw_hardness,
            'tensile_strength': self.tensile_strength,
            'inspection_date': self.inspection_date.isoformat() if self.inspection_date else None,
            'material_status': self.material_status,
            'risk_reason': self.risk_reason,
            'storage_temperature': self.storage_temperature,
            'storage_humidity': self.storage_humidity,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
