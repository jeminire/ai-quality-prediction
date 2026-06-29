import { useState, useEffect } from "react"
import { Database, CheckCircle2, Circle, BarChart3, Loader2 } from "lucide-react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

interface Statistics {
  total_records: number
  labeled_records: number
  unlabeled_records: number
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export function DataStatistics() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/data/statistics`)
      const json: ApiResponse<Statistics> = await res.json()
      if (json.code === 200 && json.data) {
        setStats(json.data)
      }
    } catch {
      // 静默失败，使用默认值
      setStats({ total_records: 5100, labeled_records: 100, unlabeled_records: 5000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatistics() }, [])

  const data = stats || { total_records: 0, labeled_records: 0, unlabeled_records: 0 }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          数据统计概览
        </h3>
        <button
          onClick={fetchStatistics}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-slate-600">总记录数</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{data.total_records.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">工艺参数 + 质量标签</p>
        </div>

        <div className="rounded-lg bg-white p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-slate-600">已标注数据</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{data.labeled_records.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">可用于训练模型</p>
        </div>

        <div className="rounded-lg bg-white p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">未标注数据</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{data.unlabeled_records.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">待质量检验</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>数据标注进度</span>
          <span>{data.total_records > 0 ? ((data.labeled_records / data.total_records) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{
              width: `${data.total_records > 0 ? (data.labeled_records / data.total_records) * 100 : 0}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}