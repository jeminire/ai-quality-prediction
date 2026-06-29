import { useState, useEffect } from "react"
import { History, RefreshCw, Loader2, AlertCircle, Eye, BarChart3 } from "lucide-react"
import ReactECharts from "echarts-for-react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

interface PredictionRecord {
  prediction_id: number
  prediction: number
  confidence: number
  features: Record<string, number>
  created_at: string
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 10

  const fetchHistory = async (currentPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/predict/history?page=${currentPage}&per_page=${perPage}`)
      const json: ApiResponse<{ data: PredictionRecord[]; total: number }> = await res.json()
      if (json.code === 200 && json.data) {
        setPredictions(json.data.data || [])
        setTotal(json.data.total)
      }
    } catch {
      setError("加载预测历史失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory(page) }, [page])

  // 预测结果分布图
  const distributionOption = predictions.length > 0 ? {
    tooltip: { trigger: "item", formatter: "{b}: {c}条 ({d}%)" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        data: [
          {
            value: predictions.filter(p => p.prediction < 0.5).length,
            name: "合格",
            itemStyle: { color: "#22c55e" }
          },
          {
            value: predictions.filter(p => p.prediction >= 0.5).length,
            name: "风险/不合格",
            itemStyle: { color: "#ef4444" }
          },
        ],
        label: { show: true, formatter: "{b}\n{d}%" },
      },
    ],
  } : null

  // 置信度趋势图
  const trendOption = predictions.length > 0 ? {
    tooltip: { trigger: "axis" },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category",
      data: predictions.map((_, i) => `预测${i + 1}`),
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
    },
    series: [
      {
        name: "预测值",
        type: "line",
        data: predictions.map(p => p.prediction),
        itemStyle: { color: "#3b82f6" },
        areaStyle: { color: "rgba(59, 130, 246, 0.1)" },
      },
      {
        name: "置信度",
        type: "line",
        data: predictions.map(p => p.confidence),
        itemStyle: { color: "#8b5cf6" },
      },
    ],
  } : null

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">预测历史</h2>
          <p className="text-sm text-slate-500 mt-1">查看历史预测记录和分析结果</p>
        </div>
        <button
          onClick={() => fetchHistory(page)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "总预测次数", value: total, color: "text-slate-800" },
          { label: "合格预测", value: predictions.filter(p => p.prediction < 0.5).length, color: "text-green-600" },
          { label: "风险预测", value: predictions.filter(p => p.prediction >= 0.5).length, color: "text-red-600" },
          { label: "平均置信度", value: predictions.length > 0 ? `${(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100).toFixed(1)}%` : "0%", color: "text-blue-600" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-2 gap-4">
        {distributionOption && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">预测结果分布</h3>
            <ReactECharts option={distributionOption} style={{ height: 220 }} />
          </div>
        )}
        {trendOption && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">预测趋势</h3>
            <ReactECharts option={trendOption} style={{ height: 220 }} />
          </div>
        )}
      </div>

      {/* 历史表格 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">预测ID</th>
                <th className="px-4 py-3 text-left">预测结果</th>
                <th className="px-4 py-3 text-right">风险值</th>
                <th className="px-4 py-3 text-right">置信度</th>
                <th className="px-4 py-3 text-left">关键参数</th>
                <th className="px-4 py-3 text-left">预测时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无预测记录，请先执行预测</p>
                  </td>
                </tr>
              ) : (
                predictions.map((pred) => (
                  <tr key={pred.prediction_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      #{pred.prediction_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        pred.prediction < 0.5
                          ? "bg-green-100 text-green-700"
                          : pred.prediction < 0.8
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {pred.prediction < 0.5 ? "合格" : pred.prediction < 0.8 ? "风险" : "不合格"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      <span className={pred.prediction >= 0.5 ? "text-red-600" : "text-green-600"}>
                        {(pred.prediction * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {(pred.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      压力: {pred.features?.forming_pressure || "-"} MPa
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {pred.created_at?.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">
              共 <strong>{total}</strong> 条记录
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-3 text-sm text-slate-600">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}