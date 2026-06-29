、# AI质量预测系统 - 数据加载与预处理示例
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import shap

# 1. 加载数据
process_data = pd.read_csv('process_data.csv')
material_data = pd.read_csv('material_data.csv')
quality_data = pd.read_csv('quality_label.csv')
equipment_data = pd.read_csv('equipment_data.csv')
environment_data = pd.read_csv('environment_data.csv')

# 2. 数据预处理
# 合并工艺数据和质量标签
merged_data = pd.merge(process_data, quality_data[['batch_id', 'quality_status']], 
                       on='batch_id', how='inner')

# 按批次聚合工艺数据（计算统计特征）
batch_features = merged_data.groupby('batch_id').agg({
    'heating_temperature': ['mean', 'std', 'min', 'max'],
    'forming_pressure': ['mean', 'std', 'min', 'max'],
    'spindle_speed': ['mean', 'std'],
    'coolant_flow': ['mean', 'std'],
    'vibration_amplitude': ['mean', 'std']
}).reset_index()

# 扁平化列名
batch_features.columns = ['batch_id'] + [f'{col[0]}_{col[1]}' for col in batch_features.columns[1:]]

# 合并物料数据
final_data = pd.merge(batch_features, 
                     material_data[['material_batch_id', 'supplier', 'silicon_content', 'material_status']],
                     left_on='batch_id', 
                     right_on='material_batch_id', 
                     how='left')

# 合并质量标签
final_data = pd.merge(final_data, 
                     quality_data[['batch_id', 'quality_status']].drop_duplicates(),
                     on='batch_id')

# 3. 准备特征和标签
X = final_data.drop(['batch_id', 'material_batch_id', 'quality_status'], axis=1)
y = final_data['quality_status']

# 处理分类变量
X = pd.get_dummies(X, columns=['supplier', 'material_status'])

# 4. 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 5. 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 6. 评估模型
y_pred = model.predict(X_test)
print("分类报告：")
print(classification_report(y_test, y_pred))

# 7. 可解释性分析
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# 可视化特征重要性
shap.summary_plot(shap_values[1], X_test, plot_type="bar")
