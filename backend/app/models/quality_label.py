from app.models import db
from datetime import datetime

class QualityLabel(db.Model):
    __tablename__ = 'quality_label'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.String(50), nullable=False)
    material_batch_id = db.Column(db.String(50), db.ForeignKey('material_batch.material_batch_id'))
    quality_status = db.Column(db.Integer, nullable=False)
    defect_type = db.Column(db.String(100))
    root_cause = db.Column(db.String(200))
    thickness = db.Column(db.Float)
    parallelism = db.Column(db.Float)
    hardness = db.Column(db.Float)
    surface_roughness = db.Column(db.Float)
    inspection_time = db.Column(db.DateTime)
    inspector = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    process_data = db.relationship('ProcessData', backref='quality_label', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'material_batch_id': self.material_batch_id,
            'quality_status': self.quality_status,
            'defect_type': self.defect_type,
            'root_cause': self.root_cause,
            'thickness': self.thickness,
            'parallelism': self.parallelism,
            'hardness': self.hardness,
            'surface_roughness': self.surface_roughness,
            'inspection_time': self.inspection_time.isoformat() if self.inspection_time else None,
            'inspector': self.inspector,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
