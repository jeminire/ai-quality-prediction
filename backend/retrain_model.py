"""
重新训练模型脚本
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.impute import SimpleImputer
import joblib

# 获取当前目录
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, 'data')

# 特征列名
feature_columns = [
    'heating_temperature', 'forming_pressure', 'spindle_speed', 
    'coolant_flow', 'vibration_amplitude', 'current_intensity',
    'mold_temperature', 'feed_rate', 'lubricant_flow', 'clamp_force'
]

def retrain_model():
    print("正在加载数据...")
    
    # 读取数据
    process_df = pd.read_csv(os.path.join(data_dir, 'process_data.csv'))
    label_df = pd.read_csv(os.path.join(data_dir, 'quality_label.csv'))
    
    print(f"过程数据记录数: {len(process_df)}")
    print(f"标签数据记录数: {len(label_df)}")
    
    # 合并数据
    merged_df = process_df.merge(label_df, on='batch_id', how='inner')
    print(f"合并后数据记录数: {len(merged_df)}")
    
    # 提取特征和标签
    X = merged_df[feature_columns].values
    y = merged_df['quality_status'].values
    
    print(f"特征形状: {X.shape}")
    print(f"标签分布: {np.bincount(y)}")
    
    # 处理缺失值
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    
    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("正在训练模型...")
    
    # 训练随机森林分类器
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced',
        n_jobs=1  # 禁用并行化，避免版本兼容问题
    )
    
    rf_model.fit(X_train, y_train)
    
    # 计算指标
    y_pred = rf_model.predict(X_test)
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'f1_score': f1_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred)
    }
    
    print("训练完成！指标如下:")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")
    
    # 创建模型包装类
    class MLModel:
        def __init__(self):
            self.model = rf_model
            self.scaler = None
            self.feature_names = feature_columns
        
        def predict_proba(self, features):
            # 直接传递1D数组
            features = np.array([features])
            return self.model.predict_proba(features)[0][1]
        
        def predict(self, features):
            features = np.array([features])
            return self.model.predict(features)[0]
        
        def get_feature_importances(self):
            return self.model.feature_importances_
    
    ml_model = MLModel()
    
    # 保存模型
    models_dir = os.path.join(current_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'quality_model_1.0.0.pkl')
    
    joblib.dump(ml_model, model_path)
    print(f"模型已保存到: {model_path}")
    
    return model_path

if __name__ == '__main__':
    retrain_model()
