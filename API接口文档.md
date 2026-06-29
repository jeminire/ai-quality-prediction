# AI质量预测与智能管控后端服务 API 接口文档

## 📌 基本信息

- **服务地址**: `http://localhost:5000`
- **API版本**: v1
- **基础路径**: `/api/v1`
- **响应格式**: JSON

---

## 📌 统一响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1700000000
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误描述",
  "data": null,
  "timestamp": 1700000000
}
```

---

## 📌 1. 数据管理模块 `/api/v1/data`

### 1.1 获取数据列表
```
GET /api/v1/data/
```

**Query参数:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| per_page | int | 10 | 每页条数 |

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "batch_id": "BATCH-20240301-001",
        "material_batch_id": "MBATCH-0181",
        "quality_status": 0,
        "defect_type": "无缺陷",
        "root_cause": "none",
        "thickness": 24.969,
        "parallelism": 0.019,
        "hardness": 210.2,
        "surface_roughness": 0.93,
        "inspection_time": "2024-03-15T08:05:00",
        "inspector": "INS-002",
        "created_at": "2024-01-01T00:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "per_page": 10
  },
  "message": "success"
}
```

---

### 1.2 获取单条数据
```
GET /api/v1/data/{id}
```

**路径参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 数据ID |

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "batch_id": "BATCH-20240301-001",
    "material_batch_id": "MBATCH-0181",
    "quality_status": 0,
    "defect_type": "无缺陷",
    "root_cause": "none",
    "thickness": 24.969,
    "parallelism": 0.019,
    "hardness": 210.2,
    "surface_roughness": 0.93,
    "inspection_time": "2024-03-15T08:05:00",
    "inspector": "INS-002",
    "created_at": "2024-01-01T00:00:00"
  },
  "message": "success"
}
```

---

### 1.3 添加单条数据
```
POST /api/v1/data/
```

**请求体:**
```json
{
  "batch_id": "BATCH-20240301-101",
  "material_batch_id": "MBATCH-0001",
  "quality_status": 0,
  "defect_type": "无缺陷",
  "root_cause": "none",
  "thickness": 25.0,
  "parallelism": 0.02,
  "hardness": 205.0,
  "surface_roughness": 0.85,
  "inspection_time": "2024-03-19 08:00:00",
  "inspector": "INS-001"
}
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "id": 101,
    "batch_id": "BATCH-20240301-101",
    "quality_status": 0,
    "created_at": "2024-03-19T08:00:00"
  },
  "message": "Data added successfully"
}
```

---

### 1.4 更新数据
```
PUT /api/v1/data/{id}
```

**请求体:**
```json
{
  "quality_status": 1,
  "defect_type": "尺寸超差",
  "root_cause": "equipment"
}
```

---

### 1.5 删除数据
```
DELETE /api/v1/data/{id}
```

### 1.6 删除指定类型数据
```
DELETE /api/v1/data/delete/{type}/{id}
```

**路径参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 数据类型 (process/material/equipment/environment/quality) |
| id | int | 数据ID |

**响应示例:**
```json
{
  "code": 200,
  "message": "Data deleted successfully"
}
```

### 1.7 导出数据
```
GET /api/v1/data/export/{type}
```

**路径参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 数据类型 (process/material/equipment/environment/quality) |

**响应:** 返回CSV文件

### 1.8 获取工艺参数数据
```
GET /api/v1/data/process/
```

**Query参数:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| per_page | int | 20 | 每页条数 |

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "heating_temperature": 850.5,
        "forming_pressure": 120.3,
        "spindle_speed": 1500.0,
        "coolant_flow": 25.2,
        "vibration_amplitude": 2.5,
        "current_intensity": 45.1,
        "mold_temperature": 180.5,
        "feed_rate": 300.0,
        "lubricant_flow": 15.2,
        "clamp_force": 80.5,
        "timestamp": "2024-03-15T08:00:00"
      }
    ],
    "total": 5000,
    "page": 1,
    "per_page": 20
  },
  "message": "success"
}
```

### 1.9 获取物料批次数据
```
GET /api/v1/data/material/
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "batch_id": "MBATCH-0001",
        "material_name": "钢材A",
        "supplier": "供应商A",
        "inbound_time": "2024-03-01",
        "status": "正常"
      }
    ],
    "total": 200,
    "page": 1,
    "per_page": 20
  },
  "message": "success"
}
```

### 1.9a 获取完整物料批次数据（用于预测选择）
```
GET /api/v1/data/material_batch
```

**说明:** 获取完整的物料批次数据，包含化学成分等详细信息，用于预测时选择物料批次

**响应示例:**
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "material_batch_id": "MBATCH-0001",
      "supplier": "A",
      "material_type": "HT300",
      "carbon_content": 3.2,
      "silicon_content": 2.0,
      "manganese_content": 0.6,
      "phosphorus_content": 0.05,
      "sulfur_content": 0.01,
      "raw_hardness": 165.0,
      "tensile_strength": 450.0,
      "material_status": "NORMAL",
      "risk_reason": "",
      "storage_temperature": 22.5,
      "storage_humidity": 45.0
    },
    {
      "id": 8,
      "material_batch_id": "MBATCH-0008",
      "supplier": "C",
      "material_type": "QT500",
      "carbon_content": 3.454,
      "silicon_content": 2.077,
      "manganese_content": 0.63,
      "phosphorus_content": 0.058,
      "sulfur_content": 0.014,
      "raw_hardness": 167.8,
      "tensile_strength": 472.7,
      "material_status": "RISK",
      "risk_reason": "硅含量偏低",
      "storage_temperature": 23.7,
      "storage_humidity": 48.7
    }
  ],
  "message": "success"
}
```

**字段说明:**
| 字段 | 类型 | 说明 |
|------|------|------|
| material_batch_id | string | 物料批次唯一标识 |
| supplier | string | 供应商 |
| material_type | string | 材料类型 |
| carbon_content | float | 碳含量(%) |
| silicon_content | float | 硅含量(%) |
| manganese_content | float | 锰含量(%) |
| phosphorus_content | float | 磷含量(%) |
| sulfur_content | float | 硫含量(%) |
| raw_hardness | float | 原材料硬度 |
| tensile_strength | float | 抗拉强度(MPa) |
| material_status | string | 物料状态 (NORMAL/RISK) |
| risk_reason | string | 风险原因 |
| storage_temperature | float | 存储温度(°C) |
| storage_humidity | float | 存储湿度(%) |

### 1.10 获取设备状态数据
```
GET /api/v1/data/equipment/
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "equipment_id": "EQ-001",
        "equipment_name": "冲压机A",
        "status": "运行中",
        "temperature": 65.5,
        "pressure": 120.3,
        "vibration": 2.5,
        "runtime_hours": 1500.5,
        "maintenance_status": "正常",
        "timestamp": "2024-03-15T08:00:00"
      }
    ],
    "total": 1000,
    "page": 1,
    "per_page": 20
  },
  "message": "success"
}
```

### 1.11 获取环境参数数据
```
GET /api/v1/data/environment/
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "temperature": 22.5,
        "humidity": 55.0,
        "dust_level": "低",
        "noise_level": 55.2,
        "air_quality": "良",
        "timestamp": "2024-03-15T08:00:00"
      }
    ],
    "total": 2000,
    "page": 1,
    "per_page": 20
  },
  "message": "success"
}
```

### 1.12 获取数据统计
```
GET /api/v1/data/statistics
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "total_records": 100,
    "qualified_count": 90,
    "defective_count": 10,
    "qualified_rate": 0.9
  },
  "message": "success"
}
```

---

### 1.13 导入工艺参数数据（从CSV）
```
POST /api/v1/data/import/process
```

**说明:** 从 `backend/data/process_data.csv` 文件导入工艺参数数据

**响应示例:**
```json
{
  "code": 200,
  "data": {"imported_count": 5000},
  "message": "Process data imported successfully"
}
```

---

### 1.14 导入质量标签数据（从CSV）
```
POST /api/v1/data/import/quality
```

**说明:** 从 `backend/data/quality_label.csv` 文件导入质量标签数据

**响应示例:**
```json
{
  "code": 200,
  "data": {"updated_count": 100},
  "message": "Quality data imported successfully"
}
```

---

### 1.15 导入物料批次数据（从CSV）
```
POST /api/v1/data/import/material
```

**说明:** 从 `backend/data/material_data.csv` 文件导入物料批次数据

**响应示例:**
```json
{
  "code": 200,
  "data": {"imported_count": 200},
  "message": "Material batch data imported successfully"
}
```

---

### 1.16 导入设备状态数据（从CSV）
```
POST /api/v1/data/import/equipment
```

**说明:** 从 `backend/data/equipment_data.csv` 文件导入设备状态数据

**响应示例:**
```json
{
  "code": 200,
  "data": {"imported_count": 1000},
  "message": "Equipment status data imported successfully"
}
```

---

### 1.17 导入环境参数数据（从CSV）
```
POST /api/v1/data/import/environment
```

**说明:** 从 `backend/data/environment_data.csv` 文件导入环境参数数据

**响应示例:**
```json
{
  "code": 200,
  "data": {"imported_count": 2000},
  "message": "Environment data imported successfully"
}
```

---

### 1.18 一键导入所有数据
```
POST /api/v1/data/import/all
```

**说明:** 一次性导入所有CSV数据文件（工艺参数、质量标签、物料批次、设备状态、环境参数）

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "process": {"imported_count": 5000},
    "quality": {"updated_count": 100},
    "material": {"imported_count": 200},
    "equipment": {"imported_count": 1000},
    "environment": {"imported_count": 2000}
  },
  "message": "All data imported successfully"
}
```

---

## 📌 2. 模型管理模块 `/api/v1/models`

### 2.1 获取模型列表
```
GET /api/v1/models/
```

**Query参数:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| per_page | int | 10 | 每页条数 |

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "quality_prediction_model",
        "version": "1.0.0",
        "status": "trained",
        "accuracy": 0.85,
        "f1_score": 0.82,
        "precision": 0.83,
        "recall": 0.81,
        "created_at": "2024-01-01T00:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 10
  },
  "message": "success"
}
```

---

### 2.2 获取单条模型
```
GET /api/v1/models/{id}
```

---

### 2.3 训练新模型
```
POST /api/v1/models/
```

**请求体:**
```json
{
  "name": "quality_prediction_model",
  "version": "1.0.0"
}
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "quality_prediction_model",
    "version": "1.0.0",
    "status": "trained",
    "accuracy": 0.85,
    "f1_score": 0.82,
    "precision": 0.83,
    "recall": 0.81,
    "feature_names": ["heating_temperature", "forming_pressure", "spindle_speed", "coolant_flow", "vibration_amplitude", "current_intensity", "mold_temperature", "feed_rate", "lubricant_flow", "clamp_force"],
    "model_path": "models/quality_prediction_model_1.0.0.json",
    "created_at": "2024-01-01T00:00:00"
  },
  "message": "Model trained successfully"
}
```

---

### 2.4 更新模型
```
PUT /api/v1/models/{id}
```

---

### 2.5 删除模型
```
DELETE /api/v1/models/{id}
```

---

### 2.6 部署模型
```
POST /api/v1/models/{id}/deploy
```

**说明:** 将模型状态设置为"已部署"，使其可以用于预测

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "quality_prediction_model",
    "status": "deployed",
    ...
  },
  "message": "Model deployed successfully"
}
```

---

### 2.7 获取最新模型
```
GET /api/v1/models/latest
```

**说明:** 获取最近训练或部署的模型

---

## 📌 3. 预测服务模块 `/api/v1/predict`

### 3.1 单条预测
```
POST /api/v1/predict/
```

**请求体（仅工艺参数）:**
```json
{
  "features": {
    "heating_temperature": 850.5,
    "forming_pressure": 120.3,
    "spindle_speed": 1500.0,
    "coolant_flow": 25.2,
    "vibration_amplitude": 2.5,
    "current_intensity": 45.1,
    "mold_temperature": 180.5,
    "feed_rate": 300.0,
    "lubricant_flow": 15.2,
    "clamp_force": 80.5
  }
}
```

**请求体（工艺参数 + 物料批次）:**
```json
{
  "features": {
    "heating_temperature": 850.5,
    "forming_pressure": 120.3,
    "spindle_speed": 1500.0,
    "coolant_flow": 25.2,
    "vibration_amplitude": 2.5,
    "current_intensity": 45.1,
    "mold_temperature": 180.5,
    "feed_rate": 300.0,
    "lubricant_flow": 15.2,
    "clamp_force": 80.5
  },
  "material": {
    "material_batch_id": "MBATCH-0008",
    "supplier": "C",
    "material_type": "QT500",
    "carbon_content": 3.454,
    "silicon_content": 2.077,
    "manganese_content": 0.63,
    "phosphorus_content": 0.058,
    "sulfur_content": 0.014,
    "raw_hardness": 167.8,
    "tensile_strength": 472.7,
    "material_status": "RISK",
    "risk_reason": "硅含量偏低",
    "storage_temperature": 23.7,
    "storage_humidity": 48.7
  }
}
```

**响应示例（仅工艺参数）:**
```json
{
  "code": 200,
  "data": {
    "prediction_id": 1,
    "prediction": 0.15,
    "confidence": 0.92
  },
  "message": "Prediction completed"
}
```

**响应示例（工艺参数 + 物料批次）:**
```json
{
  "code": 200,
  "data": {
    "prediction_id": 2,
    "prediction": 0.32,
    "confidence": 0.85,
    "material_batch_id": "MBATCH-0008",
    "material_risk_adjustment": 0.15
  },
  "message": "Prediction completed"
}
```

**说明:**
- `material_risk_adjustment` 表示物料批次带来的额外风险调整值
- 当选择风险物料时，预测的缺陷概率会相应提高
- 物料风险调整因素包括：物料状态、供应商、材料类型、化学成分等
```

---

### 3.2 批量预测
```
POST /api/v1/predict/batch
```

**请求体:**
```json
{
  "features_list": [
    {
      "heating_temperature": 850.5,
      "forming_pressure": 120.3,
      "spindle_speed": 1500.0
    },
    {
      "heating_temperature": 848.0,
      "forming_pressure": 118.5,
      "spindle_speed": 1480.0
    }
  ]
}
```

**响应示例:**
```json
{
  "code": 200,
  "data": [
    {
      "prediction_id": 1,
      "prediction": 0.85,
      "confidence": 0.92
    },
    {
      "prediction_id": 2,
      "prediction": 0.15,
      "confidence": 0.88
    }
  ],
  "message": "Batch prediction completed"
}
```

---

### 3.3 获取预测历史
```
GET /api/v1/predict/history
```

**Query参数:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| per_page | int | 10 | 每页条数 |

---

### 3.4 获取单条预测
```
GET /api/v1/predict/{id}
```

---

## 📌 4. SHAP解释模块 `/api/v1/shap`

### 4.1 获取特征重要性
```
GET /api/v1/shap/feature_importance
```

**响应示例:**
```json
{
  "code": 200,
  "data": [
    {"feature": "forming_pressure", "importance": 0.35},
    {"feature": "heating_temperature", "importance": 0.28},
    {"feature": "coolant_flow", "importance": 0.18},
    {"feature": "vibration_amplitude", "importance": 0.12},
    {"feature": "spindle_speed", "importance": 0.07}
  ],
  "message": "success"
}
```

---

### 4.2 获取SHAP汇总
```
GET /api/v1/shap/summary
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "feature_importance": [
      {"feature": "forming_pressure", "importance": 0.35}
    ],
    "feature_names": ["forming_pressure", "heating_temperature", ...],
    "sample_count": 100,
    "summary_plot_data": { ... }
  },
  "message": "success"
}
```

---

### 4.3 获取单条预测的SHAP解释
```
GET /api/v1/shap/explanation/{prediction_id}
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "prediction_id": 1,
    "prediction": 0.85,
    "explanation": {
      "base_value": 0.5,
      "feature_contributions": [
        {"feature": "forming_pressure", "value": 120.3, "contribution": 0.25},
        {"feature": "heating_temperature", "value": 850.5, "contribution": 0.10}
      ]
    }
  },
  "message": "success"
}
```

---

## 📌 5. 数据字典

### 工艺参数特征（用于预测）

| 参数名 | 类型 | 单位 | 说明 | 正常范围 |
|--------|------|------|------|----------|
| heating_temperature | float | °C | 加热温度 | 845-855 |
| forming_pressure | float | MPa | 成型压力 | 117.5-122.5 |
| spindle_speed | float | rpm | 主轴转速 | 1450-1550 |
| coolant_flow | float | L/min | 冷却液流量 | 23.8-26.2 |
| vibration_amplitude | float | mm/s | 振动幅度 | 2.2-2.8 |
| current_intensity | float | A | 电流强度 | 43.5-46.5 |
| mold_temperature | float | °C | 模具温度 | 177-183 |
| feed_rate | float | mm/min | 进给速度 | 290-310 |
| lubricant_flow | float | ml/min | 润滑剂流量 | 14.2-15.8 |
| clamp_force | float | kN | 夹紧力 | 78-82 |

### 质量标签（预测结果）

| 值 | 说明 |
|-----|------|
| 0 | 合格品 |
| 1 | 缺陷品 |

### 缺陷类型

| 值 | 说明 |
|-----|------|
| 无缺陷 | 产品合格无缺陷 |
| 尺寸超差 | 尺寸不符合要求 |
| 表面裂纹 | 表面有裂纹 |
| 硬度不足 | 硬度不达标 |
| 材料成分异常 | 材料成分问题 |

---

## 📌 6. 启动服务

```bash
cd backend
pip install -r requirements.txt
npm run dev
```

服务启动后访问: `http://localhost:5000`

---

## 📌 7. 技术栈

- **后端框架**: Flask 2.2.5
- **数据库**: SQLite
- **ORM**: SQLAlchemy 2.0+
- **机器学习**: scikit-learn
- **模型解释**: SHAP

---

## 📌 8. 注意事项

1. **数据格式**: 所有请求和响应的Content-Type为 `application/json`
2. **时间戳**: 所有时间使用ISO 8601格式
3. **分页**: 大数据量查询请使用分页参数
4. **错误处理**: 根据返回的code字段判断请求是否成功
5. **跨域**: 已配置CORS，支持前端跨域访问