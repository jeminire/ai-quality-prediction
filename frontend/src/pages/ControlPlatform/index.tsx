import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  Database, 
  FlaskConical, 
  CheckCircle, 
  Wrench, 
  CloudSun,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  MonitorPlay,
  PieChart,
  BarChart3,
  LineChart
} from "lucide-react"

const integratedModules = [
  {
    title: "数据管理",
    icon: Database,
    color: "blue",
    description: "工艺参数、物料批次、质量标签、设备状态、环境参数全维度数据管理",
    links: [
      { label: "工艺参数", href: "/data/process", icon: Database },
      { label: "物料批次", href: "/data/material", icon: FlaskConical },
      { label: "质量标签", href: "/data/quality", icon: CheckCircle },
      { label: "设备状态", href: "/data/equipment", icon: Wrench },
      { label: "环境参数", href: "/data/environment", icon: CloudSun },
    ]
  },
  {
    title: "AI质量预测",
    icon: BrainCircuit,
    color: "purple",
    description: "基于机器学习的实时质量预测与根因分析",
    links: [
      { label: "AI预测", href: "/prediction", icon: BrainCircuit },
      { label: "根因分析", href: "/prediction", icon: Activity },
      { label: "SHAP分析", href: "/prediction", icon: LineChart },
    ]
  },
  {
    title: "报告中心",
    icon: FileText,
    color: "green",
    description: "自动生成质量分析报告与预测报告",
    links: [
      { label: "质量报告", href: "/prediction", icon: FileText },
      { label: "预测报告", href: "/prediction", icon: BarChart3 },
      { label: "趋势分析", href: "/prediction", icon: TrendingUp },
    ]
  }
]

const workflowSteps = [
  { 
    step: 1, 
    title: "数据录入", 
    description: "从5大维度录入生产数据",
    icon: Database,
    color: "bg-blue-500"
  },
  { 
    step: 2, 
    title: "数据管理", 
    description: "统一管理、筛选、导入导出",
    icon: Activity,
    color: "bg-blue-600"
  },
  { 
    step: 3, 
    title: "AI预测", 
    description: "基于机器学习模型预测质量",
    icon: BrainCircuit,
    color: "bg-purple-500"
  },
  { 
    step: 4, 
    title: "根因分析", 
    description: "SHAP可解释性分析",
    icon: PieChart,
    color: "bg-purple-600"
  },
  { 
    step: 5, 
    title: "报告生成", 
    description: "自动生成分析报告",
    icon: FileText,
    color: "bg-green-500"
  }
]

const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    hover: "hover:bg-blue-100"
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    hover: "hover:bg-purple-100"
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    hover: "hover:bg-green-100"
  }
}

export default function ControlPlatform() {
  const [activeModule, setActiveModule] = useState<number | null>(null)

  return (
    <div className="p-6 space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
          <MonitorPlay className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">一体化智能管控平台</h1>
          <p className="text-slate-500 mt-1">集成数据管理与AI质量预测的全流程智能管控系统</p>
        </div>
      </div>

      {/* 工作流程展示 */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          全流程工作流
        </h2>
        <div className="flex items-center justify-between gap-2">
          {workflowSteps.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="flex-1 flex items-center">
                <div className="flex-1 flex flex-col items-center">
                  <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">{item.title}</div>
                    <div className="text-slate-400 text-xs mt-1">{item.description}</div>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="flex-shrink-0 mx-2">
                    <ArrowRight className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 集成模块卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {integratedModules.map((module, index) => {
          const Icon = module.icon
          const colors = colorMap[module.color]
          return (
            <div 
              key={module.title}
              className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6 transition-all duration-300 ${colors.hover}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 bg-white rounded-xl shadow-sm`}>
                  <Icon className={`w-8 h-8 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{module.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {module.links.map((link) => {
                  const LinkIcon = link.icon
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <LinkIcon className={`w-5 h-5 ${colors.text}`} />
                        <span className="font-medium text-slate-700">{link.label}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 快捷操作入口 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MonitorPlay className="w-6 h-6 text-blue-600" />
          快捷操作入口
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            to="/data/process"
            className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
          >
            <Database className="w-10 h-10 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">工艺参数</span>
          </Link>
          <Link
            to="/data/material"
            className="flex flex-col items-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
          >
            <FlaskConical className="w-10 h-10 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">物料批次</span>
          </Link>
          <Link
            to="/data/quality"
            className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
          >
            <CheckCircle className="w-10 h-10 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">质量标签</span>
          </Link>
          <Link
            to="/data/equipment"
            className="flex flex-col items-center p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
          >
            <Wrench className="w-10 h-10 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">设备状态</span>
          </Link>
          <Link
            to="/data/environment"
            className="flex flex-col items-center p-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors group"
          >
            <CloudSun className="w-10 h-10 text-cyan-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">环境参数</span>
          </Link>
          <Link
            to="/prediction"
            className="flex flex-col items-center p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors group"
          >
            <BrainCircuit className="w-10 h-10 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-700 text-center">AI预测</span>
          </Link>
        </div>
      </div>

      {/* 平台优势 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 opacity-80" />
            <h3 className="text-lg font-bold">统一数据管理</h3>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            整合5大维度生产数据，支持导入导出、筛选查询、实时同步
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="w-8 h-8 opacity-80" />
            <h3 className="text-lg font-bold">AI智能预测</h3>
          </div>
          <p className="text-purple-100 text-sm leading-relaxed">
            基于机器学习模型，实时预测产品质量，提前发现潜在风险
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <h3 className="text-lg font-bold">自动报告生成</h3>
          </div>
          <p className="text-green-100 text-sm leading-relaxed">
            一键生成质量分析报告，支持导出打印，便于存档追溯
          </p>
        </div>
      </div>
    </div>
  )
}
