from app.models import db
from datetime import datetime

class ProcessData(db.Model):
    __tablename__ = 'process_data'
    
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.String(50), unique=True, nullable=False)
    batch_id = db.Column(db.String(50), db.ForeignKey('quality_label.batch_id'))
    timestamp = db.Column(db.DateTime)
    heating_temperature = db.Column(db.Float)
    forming_pressure = db.Column(db.Float)
    spindle_speed = db.Column(db.Float)
    coolant_flow = db.Column(db.Float)
    vibration_amplitude = db.Column(db.Float)
    current_intensity = db.Column(db.Float)
    mold_temperature = db.Column(db.Float)
    feed_rate = db.Column(db.Float)
    lubricant_flow = db.Column(db.Float)
    clamp_force = db.Column(db.Float)
    equipment_id = db.Column(db.String(50), db.ForeignKey('equipment_status.equipment_id'))
    operator_id = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'record_id': self.record_id,
            'batch_id': self.batch_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'heating_temperature': self.heating_temperature,
            'forming_pressure': self.forming_pressure,
            'spindle_speed': self.spindle_speed,
            'coolant_flow': self.coolant_flow,
            'vibration_amplitude': self.vibration_amplitude,
            'current_intensity': self.current_intensity,
            'mold_temperature': self.mold_temperature,
            'feed_rate': self.feed_rate,
            'lubricant_flow': self.lubricant_flow,
            'clamp_force': self.clamp_force,
            'equipment_id': self.equipment_id,
            'operator_id': self.operator_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
