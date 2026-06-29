from app.models import db
from datetime import datetime

class EnvironmentData(db.Model):
    __tablename__ = 'environment_data'
    
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    air_pressure = db.Column(db.Float)
    dust_concentration = db.Column(db.Float)
    noise_level = db.Column(db.Float)
    light_intensity = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'zone_id': self.zone_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'air_pressure': self.air_pressure,
            'dust_concentration': self.dust_concentration,
            'noise_level': self.noise_level,
            'light_intensity': self.light_intensity,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
