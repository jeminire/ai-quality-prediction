from app.models import db
from datetime import datetime

class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('models.id'), nullable=False)
    input_features = db.Column(db.JSON, nullable=False)
    prediction = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Float)
    shap_values = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    model = db.relationship('Model', backref=db.backref('predictions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_id': self.model_id,
            'input_features': self.input_features,
            'prediction': self.prediction,
            'confidence': self.confidence,
            'shap_values': self.shap_values,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }