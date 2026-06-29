import numpy as np
from app.ml.trainer import ModelTrainer

class Predictor:
    def __init__(self):
        self.model = None
        self.model_path = None
    
    def load_model(self, model_path):
        self.model = ModelTrainer.load_model(model_path)
        self.model_path = model_path
        return self.model is not None
    
    def predict(self, features):
        if self.model is None:
            raise ValueError("Model not loaded")
        
        features = np.array(features).reshape(1, -1)
        prediction = self.model.predict(features)
        return prediction[0]
    
    def batch_predict(self, features_list):
        if self.model is None:
            raise ValueError("Model not loaded")
        
        features_array = np.array(features_list)
        predictions = self.model.predict(features_array)
        return predictions.tolist()
    
    def predict_with_confidence(self, features):
        if self.model is None:
            raise ValueError("Model not loaded")
        
        features = np.array(features).reshape(1, -1)
        prediction = self.model.predict(features)
        
        if hasattr(self.model, 'estimators_'):
            predictions = [est.predict(features) for est in self.model.estimators_]
            std_dev = np.std(predictions)
            confidence = 1 - std_dev / (prediction[0] + 1e-8)
        else:
            confidence = 0.8
        
        return prediction[0], min(confidence, 1.0)