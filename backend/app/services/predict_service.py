import json
from app.models import db, Prediction
from app.ml.trainer import MLTrainer
from app.services.model_service import ModelService

class PredictService:
    _model = None
    _current_model_info = None
    
    @classmethod
    def _load_model(cls):
        model_info = ModelService.get_latest_model()
        if not model_info:
            raise ValueError("No model available")
        
        if cls._current_model_info and cls._current_model_info['id'] == model_info['id']:
            return
        
        cls._model = MLTrainer.load_model(model_info['model_path'])
        cls._current_model_info = model_info
    
    @staticmethod
    def _convert_features(features, feature_names):
        """
        将特征字典按固定顺序转换为特征向量
        
        Args:
            features: 特征字典
            feature_names: 特征名称列表（按顺序）
            
        Returns:
            特征值列表
        """
        feature_values = []
        for feature_name in feature_names:
            feature_values.append(features.get(feature_name, 0.0))
        return feature_values
    
    @staticmethod
    def predict(features, material=None):
        PredictService._load_model()
        
        # 获取特征顺序
        feature_names = PredictService._current_model_info.get('feature_names', [])
        
        # 按特征顺序转换输入
        feature_values = PredictService._convert_features(features, feature_names)
        
        # 预测概率（正类概率）- 直接传递1D数组，MLModel内部会处理
        prediction_prob = PredictService._model.predict_proba(feature_values)
        
        # 如果提供了物料批次信息，根据物料状态调整预测结果
        material_risk_adjustment = 0.0
        material_batch_id = None
        if material:
            material_batch_id = material.get('material_batch_id')
            material_status = material.get('material_status', 'NORMAL')
            
            # 风险物料增加缺陷概率
            if material_status == 'RISK':
                # 物料风险调整因子（根据物料风险等级调整）
                risk_reason = material.get('risk_reason', '')
                
                # 根据风险原因调整
                if 'sulfur' in risk_reason.lower() or 'phosphorus' in risk_reason.lower():
                    material_risk_adjustment = 0.15  # 成分异常风险较高
                elif 'hardness' in risk_reason.lower():
                    material_risk_adjustment = 0.10  # 硬度问题风险
                else:
                    material_risk_adjustment = 0.08  # 其他风险
                
                print(f"[PredictService] Material risk adjustment: {material_risk_adjustment} for {material_batch_id}")
            
            # 材料类型影响
            material_type = material.get('material_type', '')
            if 'HT300' in material_type:
                material_risk_adjustment += 0.02  # HT300材质略高风险
            elif 'QT500' in material_type:
                material_risk_adjustment += 0.03  # QT500材质风险较高
            elif 'QT450' in material_type:
                material_risk_adjustment += 0.01  # QT450材质略高风险
            
            # 供应商影响
            supplier = material.get('supplier', '')
            if supplier == 'C':
                material_risk_adjustment += 0.03  # 供应商C风险较高
            elif supplier == 'B':
                material_risk_adjustment += 0.01  # 供应商B略高风险
            
            # 化学成分影响
            carbon_content = material.get('carbon_content', 0)
            if carbon_content > 3.5:
                material_risk_adjustment += 0.02  # 碳含量过高
            
            silicon_content = material.get('silicon_content', 0)
            if silicon_content > 2.2:
                material_risk_adjustment += 0.02  # 硅含量过高
            
            phosphorus_content = material.get('phosphorus_content', 0)
            if phosphorus_content > 0.3:
                material_risk_adjustment += 0.03  # 磷含量过高（脆性）
            
            sulfur_content = material.get('sulfur_content', 0)
            if sulfur_content > 0.12:
                material_risk_adjustment += 0.03  # 硫含量过高（热脆性）
        
        # 应用物料风险调整
        if material_risk_adjustment > 0:
            prediction_prob = min(0.99, prediction_prob + material_risk_adjustment)
        
        # 计算置信度 = max(prob, 1-prob)
        confidence = max(prediction_prob, 1 - prediction_prob)
        
        print(f"[PredictService] Saving prediction to database: prediction={prediction_prob}, confidence={confidence}")
        
        prediction_record = Prediction(
            model_id=PredictService._current_model_info['id'],
            input_features=features,
            prediction=prediction_prob,
            confidence=confidence,
            shap_values=None
        )
        
        db.session.add(prediction_record)
        db.session.commit()
        
        print(f"[PredictService] Prediction saved with ID: {prediction_record.id}")
        
        return {
            'prediction_id': prediction_record.id,
            'prediction': float(prediction_prob),
            'confidence': float(confidence),
            'material_batch_id': material_batch_id,
            'material_risk_adjustment': material_risk_adjustment if material else None
        }
    
    @staticmethod
    def batch_predict(features_list):
        PredictService._load_model()
        
        feature_names = PredictService._current_model_info.get('feature_names', [])
        results = []
        
        for features in features_list:
            feature_values = PredictService._convert_features(features, feature_names)
            prediction_prob = PredictService._model.predict_proba(feature_values)
            confidence = max(prediction_prob, 1 - prediction_prob)
            
            prediction_record = Prediction(
                model_id=PredictService._current_model_info['id'],
                input_features=features,
                prediction=prediction_prob,
                confidence=confidence,
                shap_values=None
            )
            
            db.session.add(prediction_record)
            
            results.append({
                'prediction_id': prediction_record.id,
                'prediction': float(prediction_prob),
                'confidence': float(confidence)
            })
        
        db.session.commit()
        return results
    
    @staticmethod
    def get_predictions(page=1, per_page=10):
        paginated = Prediction.query.order_by(Prediction.created_at.desc()).paginate(page=page, per_page=per_page)
        return {
            'data': [p.to_dict() for p in paginated.items],
            'total': paginated.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_prediction_by_id(prediction_id):
        prediction = Prediction.query.get(prediction_id)
        return prediction.to_dict() if prediction else None
    
    @staticmethod
    def delete_prediction(prediction_id):
        prediction = Prediction.query.get(prediction_id)
        if not prediction:
            return None
        
        db.session.delete(prediction)
        db.session.commit()
        return True
    
    @staticmethod
    def delete_all_predictions():
        Prediction.query.delete()
        db.session.commit()
        return True