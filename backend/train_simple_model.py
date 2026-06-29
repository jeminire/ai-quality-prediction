"""
替代模型实现 - 使用简单的逻辑回归替代随机森林
"""
import os
import sys
import pandas as pd
import numpy as np
import joblib

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 从trainer导入类
from app.ml.trainer import SimpleLogisticModel

# 获取当前目录
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, 'data')

# 特征列名
feature_columns = [
    'heating_temperature', 'forming_pressure', 'spindle_speed', 
    'coolant_flow', 'vibration_amplitude', 'current_intensity',
    'mold_temperature', 'feed_rate', 'lubricant_flow', 'clamp_force'
]

def train_simple_model():
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
    from sklearn.impute import SimpleImputer
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    
    # 标准化
    scaler_mean = np.mean(X, axis=0)
    scaler_std = np.std(X, axis=0)
    scaler_std[scaler_std == 0] = 1  # 避免除以0
    X_scaled = (X - scaler_mean) / scaler_std
    
    # 使用梯度下降训练逻辑回归
    print("正在训练模型...")
    weights = np.zeros(X_scaled.shape[1])
    bias = 0.0
    learning_rate = 0.1
    epochs = 1000
    
    def sigmoid(z):
        """Sigmoid函数"""
        return 1 / (1 + np.exp(-z))
    
    for epoch in range(epochs):
        # 前向传播
        z = np.dot(X_scaled, weights) + bias
        predictions = sigmoid(z)
        
        # 计算梯度
        error = predictions - y
        gradient_w = np.dot(X_scaled.T, error) / len(y)
        gradient_b = np.mean(error)
        
        # 更新权重
        weights -= learning_rate * gradient_w
        bias -= learning_rate * gradient_b
    
    # 计算准确率
    predictions = (sigmoid(np.dot(X_scaled, weights) + bias) >= 0.5).astype(int)
    accuracy = np.mean(predictions == y)
    print(f"训练完成！准确率: {accuracy:.4f}")
    
    # 创建模型
    model = SimpleLogisticModel()
    model.weights = weights
    model.bias = bias
    model.scaler_mean = scaler_mean
    model.scaler_std = scaler_std
    
    # 保存模型
    models_dir = os.path.join(current_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'quality_model_1.0.0.pkl')
    
    joblib.dump(model, model_path)
    print(f"模型已保存到: {model_path}")
    
    return model_path

if __name__ == '__main__':
    train_simple_model()
