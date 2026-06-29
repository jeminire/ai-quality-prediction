import { useState, useEffect } from "react"
import { Brain, Play, CheckCircle2, Clock, BarChart3, Loader2, AlertCircle } from "lucide-react"
import ReactECharts from "echarts-for-react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

interface Model {
  id: number
  name: string
  version: string
  status: string
  accuracy: number
  f1_score: number
  precision: number
  recall: number
  created_at: string
  model_path: string
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export function ModelManager() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [deployingId, setDeployingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/models/?page=1&per_page=100`)
      const json: ApiResponse<{ data: Model[]; total: number }> = await res.json()
      if (json.code === 200 && json.data) {
        setModels(json.data.data || [])
      }
    } catch {
      setError("加载模型列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchModels() }, [])

  const handleDeploy = async (id: number) => {
    setDeployingId(id)
    try {
      const res = await fetch(`${BASE_URL}/models/${id}/deploy`, { method: "POST" })
      const json = await res.json()
      if (json.code === 200) {
        fetchModels()
      } else {
        setError(json.message || "部署失败")
      }
    } catch {
      setError("网络错误")
    } finally {
      setDeployingId(null)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    trained: { label: "已训练", color: "bg-blue-100 text-blue-700", icon: <Brain className="h-4 w-4" /> },
    deployed: { label: "已部署", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
    training: { label: "训练中", color: "bg-amber-100 text-amber-700", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  }

  // 模型性能对比图
  const performanceOption = models.length > 0 ? {
    tooltip: { trigger: "axis" },
    legend: { data: ["准确率", "F1分数", "精确率", "召回率"], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: "category",
      data: models.map(m => `${m.name} v${m.version}`),
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
    },
    series: [
      { name: "准确率", type: "bar", data: models.map(m => m.accuracy), itemStyle: { color: "#3b82f6" } },
      { name: "F1分数", type: "bar", data: models.map(m => m.f1_score), itemStyle: { color: "#8b5cf6" } },
      { name: "精确率", type: "bar", data: models.map(m => m.precision), itemStyle: { color: "#22c55e" } },
      { name: "召回率", type: "bar", data: models.map(m => m.recall), itemStyle: { color: "#f59e0b" } },
    ],
  } : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">模型管理</h2>
          <p className="text-sm text-slate-500 mt-1">查看、部署和管理AI预测模型</p>
        </div>
        <button
          onClick={fetchModels}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* 模型列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => {
          const status = statusConfig[model.status] || statusConfig.trained
          return (
            <div key={model.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${status.color}`}>
                    {status.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{model.name}</h3>
                    <p className="text-xs text-slate-500">v{model.version}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">准确率</p>
                  <p className="text-lg font-bold text-blue-600">{(model.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">F1分数</p>
                  <p className="text-lg font-bold text-violet-600">{(model.f1_score * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">精确率</p>
                  <p className="text-lg font-bold text-green-600">{(model.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">召回率</p>
                  <p className="text-lg font-bold text-amber-600">{(model.recall * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {model.created_at?.slice(0, 16).replace("T", " ")}
                </span>
                <span className="font-mono">{model.model_path}</span>
              </div>

              {model.status === "trained" && (
                <button
                  onClick={() => handleDeploy(model.id)}
                  disabled={deployingId === model.id}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {deployingId === model.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />部署中...</>
                  ) : (
                    <><Play className="h-4 w-4" />部署模型</>
                  )}
                </button>
              )}

              {model.status === "deployed" && (
                <div className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  已部署，可用于预测
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 性能对比图 */}
      {performanceOption && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            模型性能对比
          </h3>
          <ReactECharts option={performanceOption} style={{ height: 300 }} />
        </div>
      )}

      {models.length === 0 && !loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">暂无模型，请先前往「数据导入」页面训练模型</p>
        </div>
      )}
    </div>
  )
}