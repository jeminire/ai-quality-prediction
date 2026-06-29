# AI质量预测与智能管控系统 - 前端

基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化前端应用。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问前端: `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

---

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/           # 公共组件
│   │   └── layout/          # 布局组件
│   │       ├── Sidebar.tsx   # 侧边导航栏
│   │       ├── Header.tsx    # 顶部栏（含预警通知）
│   │       └── Layout.tsx    # 页面布局容器
│   ├── pages/                # 页面组件
│   │   ├── ControlPlatform/  # 一体化智能管控平台
│   │   ├── DataManage/       # 数据管理模块
│   │   └── Prediction/       # AI质量预测模块
│   ├── sections/             # 业务模块组件
│   │   └── Prediction/       # 预测功能组件
│   ├── hooks/               # 自定义Hooks
│   │   └── useTableData.ts   # 表格数据管理Hook
│   ├── types/               # TypeScript类型定义
│   │   └── dashboard.ts      # 数据看板类型
│   └── services/             # API服务
├── public/                   # 静态资源
└── package.json              # 依赖配置
```

---

## 📊 页面模块

### 1. 一体化智能管控平台 (`/control-platform`)
- 全流程工作流展示
- 三大集成模块卡片
- 快捷操作入口
- 平台优势介绍

### 2. 数据管理 (`/data`)
- **工艺参数** (`/data/process`) - 10项工艺参数管理
- **物料批次** (`/data/material`) - 物料批次管理
- **质量标签** (`/data/quality`) - 质量检测结果
- **设备状态** (`/data/equipment`) - 设备运行状态
- **环境参数** (`/data/environment`) - 环境数据记录

每个子模块功能：
- ✅ CSV数据导入
- ✅ CSV数据导出
- ✅ 数据删除
- ✅ 分页浏览（每页20条）
- ✅ 数据筛选过滤

### 3. AI质量预测 (`/prediction`)
- **单条预测** - 输入工艺参数和/或选择物料批次获取实时质量预测
- **批量预测** - 上传CSV文件进行批量质量预测
- **根因分析** - 基于SHAP值分析质量问题的根本原因
- **预测趋势图表** - SVG折线面积图展示历史预测趋势
- **质量分析报告** - 一键生成质量分析报告

**物料批次预测功能：**
- 支持在预测时选择物料批次（可选）
- 物料批次信息包含：供应商、材料类型、化学成分（碳、硅、锰、磷、硫）、硬度、抗拉强度等
- 风险物料会提高缺陷概率预测值
- 预测结果会显示物料批次信息和风险调整值

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI框架 |
| TypeScript | 类型安全 |
| Vite 6 | 构建工具 |
| Tailwind CSS 3 | 样式框架 |
| Lucide React | 图标库 |
| React Router | 路由管理 |

---

## 📝 开发指南

### 添加新页面

1. 在 `src/pages/` 下创建页面组件
2. 在 `App.tsx` 中添加路由
3. 在侧边栏 `Sidebar.tsx` 中添加导航链接

### API请求

通过Vite代理访问后端API：
```javascript
const response = await fetch('/api/v1/data/')
```

### 组件开发

使用Tailwind CSS进行样式开发，参考 [Tailwind文档](https://tailwindcss.com/docs)。

---

## 📌 注意事项

1. 前端默认访问 `http://localhost:5173`
2. 后端服务运行在 `http://localhost:5000`
3. Vite已配置代理，无需跨域配置
