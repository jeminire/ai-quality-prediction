import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import StandardScaler

def sigmoid(z):
    """Sigmoid函数"""
    return 1 / (1 + np.exp(-z))

class SimpleLogisticModel:
    """简单的逻辑回归模型 - 用于替代sklearn模型"""
    def __init__(self):
        self.weights = np.zeros(10)
        self.bias = 0.0
        self.scaler_mean = np.zeros(10)
        self.scaler_std = np.ones(10)
        self.feature_names = [
            'heating_temperature', 'forming_pressure', 'spindle_speed', 
            'coolant_flow', 'vibration_amplitude', 'current_intensity',
            'mold_temperature', 'feed_rate', 'lubricant_flow', 'clamp_force'
        ]
    
    def predict_proba(self, features):
        """预测概率"""
        features = np.array(features)
        # 标准化
        features = (features - self.scaler_mean) / self.scaler_std
        # 计算线性组合
        z = np.dot(features, self.weights) + self.bias
        # 返回正类概率
        return float(sigmoid(z))
    
    def predict(self, features):
        """预测类别"""
        prob = self.predict_proba(features)
        return 1 if prob >= 0.5 else 0
    
    def get_feature_importances(self):
        """获取特征重要性（权重绝对值）"""
        return np.abs(self.weights)

class MLModel:
    """机器学习模型封装"""
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
    
    def predict_proba(self, features):
        """预测概率"""
        if self.scaler:
            features = self.scaler.transform([features])
        else:
            features = np.array([features])
        return self.model.predict_proba(features)[0][1]  # 返回正类概率
    
    def predict(self, features):
        """预测类别"""
        if self.scaler:
            features = self.scaler.transform([features])
        else:
            features = np.array([features])
        return self.model.predict(features)[0]
    
    def get_feature_importances(self):
        """获取特征重要性"""
        if self.model and hasattr(self.model, 'feature_importances_'):
            return self.model.feature_importances_
        return None

class MLTrainer:
    """机器学习训练器"""
    
    def __init__(self):
        self.model = MLModel()
    
    def train(self, X, y, feature_names):
        """
        训练随机森林分类器
        
        Args:
            X: 特征矩阵
            y: 标签数组
            feature_names: 特征名称列表
            
        Returns:
            训练指标字典
        """
        # 转换为numpy数组
        X = np.array(X)
        y = np.array(y)
        
        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 训练随机森林分类器
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
        
        rf_model.fit(X_train, y_train)
        
        # 预测
        y_pred = rf_model.predict(X_test)
        y_pred_proba = rf_model.predict_proba(X_test)[:, 1]
        
        # 计算指标
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred)
        }
        
        # 保存模型
        self.model.model = rf_model
        self.model.feature_names = feature_names
        
        return metrics
    
    def save_model(self, model_name, version, model_storage_path='models/'):
        """
        保存模型到文件
        
        Args:
            model_name: 模型名称
            version: 版本号
            model_storage_path: 存储路径
            
        Returns:
            模型文件路径
        """
        os.makedirs(model_storage_path, exist_ok=True)
        model_path = os.path.join(model_storage_path, f'{model_name}_{version}.pkl')
        
        # 保存模型对象
        joblib.dump(self.model, model_path)
        
        return model_path
    
    @staticmethod
    def load_model(model_path):
        """
        从文件加载模型
        
        Args:
            model_path: 模型文件路径
            
        Returns:
            MLModel对象
        """
        import os
        # 如果是相对路径，从应用根目录解析
        if not os.path.isabs(model_path):
            # 获取应用根目录（backend目录）
            app_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(app_root, model_path)
        
        print(f"[MLTrainer] Loading model from: {model_path}")
        print(f"[MLTrainer] Model exists: {os.path.exists(model_path)}")
        
        if os.path.exists(model_path):
            return joblib.load(model_path)
        return None