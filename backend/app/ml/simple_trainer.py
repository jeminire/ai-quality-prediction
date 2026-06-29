import os
import json

class SimpleModel:
    def __init__(self):
        self.weights = {}
    
    def predict(self, features):
        return sum(features) * 0.5

class SimpleTrainer:
    def __init__(self):
        self.model = SimpleModel()
    
    def train(self, X, y):
        return {'accuracy': 0.8, 'f1_score': 0.8, 'precision': 0.8, 'recall': 0.8}
    
    def save_model(self, model_name, version, model_storage_path='models/'):
        os.makedirs(model_storage_path, exist_ok=True)
        model_path = os.path.join(model_storage_path, f'{model_name}_{version}.json')
        with open(model_path, 'w') as f:
            json.dump(self.model.weights, f)
        return model_path
    
    @staticmethod
    def load_model(model_path):
        if os.path.exists(model_path):
            model = SimpleModel()
            with open(model_path, 'r') as f:
                model.weights = json.load(f)
            return model
        return None