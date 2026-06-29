import json
from app.models import Prediction
from app.services.model_service import ModelService
from app.services.predict_service import PredictService
from app.ml.trainer import MLTrainer
from app.ml.shap_explainer import SHAPExplainer

class SHAPService:
    _explainer = None
    _current_model_id = None
    
    @classmethod
    def _get_explainer(cls):
        """获取SHAP解释器"""
        model_info = ModelService.get_latest_model()
        if not model_info:
            return None
        
        # 检查模型是否已更改
        if cls._current_model_id != model_info['id']:
            model = MLTrainer.load_model(model_info['model_path'])
            if model:
                cls._explainer = SHAPExplainer(model)
                cls._current_model_id = model_info['id']
        
        return cls._explainer
    
    @staticmethod
    def get_feature_importance():
        """获取全局特征重要性"""
        try:
            explainer = SHAPService._get_explainer()
            if not explainer:
                return []
            
            return explainer.get_feature_importance()
        except Exception as e:
            return []
    
    @staticmethod
    def get_explanation(prediction_id):
        """获取单条预测的SHAP解释"""
        prediction = Prediction.query.get(prediction_id)
        if not prediction:
            return None
        
        try:
            # 获取模型信息和解释器
            model_info = ModelService.get_latest_model()
            if not model_info:
                return None
            
            explainer = SHAPService._get_explainer()
            if not explainer:
                return None
            
            # 获取输入特征并按顺序转换
            input_features = prediction.input_features
            feature_names = model_info.get('feature_names', [])
            
            # 转换特征为列表
            feature_values = []
            for feature_name in feature_names:
                feature_values.append(input_features.get(feature_name, 0.0))
            
            # 计算SHAP解释
            explanation = explainer.explain_instance(feature_values)
            
            if explanation:
                return {
                    'prediction_id': prediction_id,
                    'prediction': float(prediction.prediction),
                    'explanation': explanation
                }
            else:
                return {
                    'prediction_id': prediction_id,
                    'prediction': float(prediction.prediction),
                    'explanation': {'error': 'Failed to compute SHAP values'}
                }
        
        except Exception as e:
            return {
                'prediction_id': prediction_id,
                'prediction': float(prediction.prediction),
                'explanation': {'error': str(e)}
            }
    
    @staticmethod
    def get_summary():
        """获取SHAP汇总数据"""
        try:
            model_info = ModelService.get_latest_model()
            if not model_info:
                return {}
            
            explainer = SHAPService._get_explainer()
            if not explainer:
                return {}
            
            feature_importance = explainer.get_feature_importance()
            
            return {
                'feature_importance': feature_importance,
                'feature_names': model_info.get('feature_names', []),
                'sample_count': 0  # 可以根据需要添加样本数量
            }
        except Exception as e:
            return {}