import os
from app.models import db, Model
from app.ml.trainer import MLTrainer
from app.services.data_service import DataService

class ModelService:
    @staticmethod
    def get_models(page=1, per_page=10):
        paginated = Model.query.order_by(Model.created_at.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [m.to_dict() for m in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_model_by_id(model_id):
        model = Model.query.get(model_id)
        return model.to_dict() if model else None
    
    @staticmethod
    def train_model(name, version='1.0.0'):
        X, y, feature_names = DataService.get_training_data()
        
        if len(X) == 0:
            raise ValueError("No training data available")
        
        trainer = MLTrainer()
        metrics = trainer.train(X, y, feature_names)
        
        # 获取模型存储路径
        project_root = DataService.get_project_root()
        model_storage_path = os.path.join(project_root, 'models')
        model_path = trainer.save_model(name, version, model_storage_path)
        
        new_model = Model(
            name=name,
            version=version,
            status='trained',
            accuracy=metrics['accuracy'],
            f1_score=metrics['f1_score'],
            precision=metrics['precision'],
            recall=metrics['recall'],
            feature_names=feature_names,
            model_path=model_path
        )
        
        db.session.add(new_model)
        db.session.commit()
        
        return new_model.to_dict()
    
    @staticmethod
    def update_model(model_id, **kwargs):
        model = Model.query.get(model_id)
        if not model:
            return None
        
        for key, value in kwargs.items():
            if hasattr(model, key):
                setattr(model, key, value)
        
        db.session.commit()
        return model.to_dict()
    
    @staticmethod
    def delete_model(model_id):
        model = Model.query.get(model_id)
        if not model:
            return False
        
        # 删除模型文件
        if model.model_path and os.path.exists(model.model_path):
            os.remove(model.model_path)
        
        db.session.delete(model)
        db.session.commit()
        return True
    
    @staticmethod
    def deploy_model(model_id):
        model = Model.query.get(model_id)
        if not model:
            return None
        
        model.status = 'deployed'
        db.session.commit()
        return model.to_dict()
    
    @staticmethod
    def get_latest_model():
        model = Model.query.filter_by(status='deployed').order_by(Model.created_at.desc()).first()
        if not model:
            model = Model.query.order_by(Model.created_at.desc()).first()
        return model.to_dict() if model else None