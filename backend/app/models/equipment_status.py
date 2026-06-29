from app.models import db
from datetime import datetime

class EquipmentStatus(db.Model):
    __tablename__ = 'equipment_status'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime)
    status = db.Column(db.String(20))
    temperature = db.Column(db.Float)
    vibration = db.Column(db.Float)
    power_consumption = db.Column(db.Float)
    oil_pressure = db.Column(db.Float)
    hydraulic_pressure = db.Column(db.Float)
    spindle_load = db.Column(db.Float)
    operating_hours = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    process_data = db.relationship('ProcessData', backref='equipment', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status,
            'temperature': self.temperature,
            'vibration': self.vibration,
            'power_consumption': self.power_consumption,
            'oil_pressure': self.oil_pressure,
            'hydraulic_pressure': self.hydraulic_pressure,
            'spindle_load': self.spindle_load,
            'operating_hours': self.operating_hours,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
