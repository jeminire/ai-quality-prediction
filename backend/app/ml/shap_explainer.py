import shap
import numpy as np

class SHAPExplainer:
    """SHAP解释器封装"""
    
    def __init__(self, model):
        """
        初始化SHAP解释器
        
        Args:
            model: MLModel对象
        """
        self.model = model
        self.explainer = None
        
        if model and model.model:
            self.explainer = shap.TreeExplainer(model.model)
    
    def get_feature_importance(self):
        """
        获取全局特征重要性（使用SHAP值的绝对值均值）
        
        Returns:
            特征重要性列表，按重要性降序排列
        """
        if not self.explainer or not self.model.feature_names:
            return []
        
        # 使用模型内置的特征重要性
        importances = self.model.get_feature_importances()
        
        if importances is None:
            return []
        
        feature_importance = []
        for name, importance in zip(self.model.feature_names, importances):
            feature_importance.append({
                'feature': name,
                'importance': float(importance)
            })
        
        # 按重要性降序排列
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return feature_importance
    
    def explain_instance(self, features):
        """
        解释单条预测的SHAP值
        
        Args:
            features: 特征值列表（按模型训练时的特征顺序）
            
        Returns:
            SHAP解释结果
        """
        if not self.explainer:
            return None
        
        try:
            # 计算SHAP值
            shap_values = self.explainer.shap_values(np.array([features]))
            
            # 处理分类模型的SHAP值（返回两个数组，取正类）
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # 取正类的SHAP值
            
            shap_values = shap_values[0]  # 取第一条记录
            
            # 获取基准值（训练集平均预测概率）
            base_value = float(self.explainer.expected_value)
            if isinstance(base_value, list):
                base_value = float(base_value[1])  # 取正类的基准值
            
            # 构建特征贡献列表
            feature_contributions = []
            for i, feature_name in enumerate(self.model.feature_names):
                feature_contributions.append({
                    'feature': feature_name,
                    'value': float(features[i]),
                    'contribution': float(shap_values[i])
                })
            
            # 按贡献绝对值降序排列
            feature_contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
            
            return {
                'base_value': base_value,
                'feature_contributions': feature_contributions
            }
        
        except Exception as e:
            return None
    
    def get_summary_data(self, X):
        """
        获取SHAP汇总数据
        
        Args:
            X: 特征矩阵
            
        Returns:
            汇总数据字典
        """
        if not self.explainer or not self.model.feature_names:
            return {}
        
        try:
            shap_values = self.explainer.shap_values(X)
            
            # 处理分类模型
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            
            return {
                'shap_values': shap_values.tolist(),
                'feature_names': self.model.feature_names,
                'sample_count': len(X)
            }
        except Exception as e:
            return {}