import { useState, useEffect } from "react"
import { Clock, ChevronRight, Trash2, Eye, RefreshCw } from "lucide-react"
import type { PredictionResult, ProcessParams } from "@/types/prediction"
import { getQualityStatus } from "@/types/prediction"
import { useApi } from "@/hooks/useApi"

interface HistoryItem {
  id: string
  timestamp: string
  params: ProcessParams
  result: PredictionResult
}

interface HistoryTableProps {
  onSelect?: (item: HistoryItem) => void
  compact?: boolean
}

export function HistoryTable({ onSelect, compact }: HistoryTableProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const { call } = useApi()

  const loadHistory = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
      const response = await fetch(`${apiBase}/predict/history?per_page=50`)
      const data = await response.json()
      if (data && data.code === 200 && data.data) {
        const apiHistory = data.data.data.map((item: any) => ({
          id: item.id.toString(),
          timestamp: item.created_at,
          params: item.input_features,
          result: {
            prediction_id: item.id,
            prediction: item.prediction,
            confidence: item.confidence
          }
        }))
        // 合并本地数据和新加载的数据，避免丢失新添加的记录
        setHistory(prev => {
          const merged = [...prev]
          apiHistory.forEach((newItem: HistoryItem) => {
            if (!merged.some(item => item.id === newItem.id)) {
              merged.push(newItem)
            }
          })
          // 按时间排序，最新的在前
          merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          return merged.slice(0, 50)
        })
      } else {
        const stored = JSON.parse(localStorage.getItem("prediction-history") || "[]")
        setHistory(stored)
      }
    } catch {
      const stored = JSON.parse(localStorage.getItem("prediction-history") || "[]")
      setHistory(stored)
    }
  }

  useEffect(() => {
    loadHistory()

    const interval = setInterval(() => {
      loadHistory()
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleDelete = async (id: string) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
    try {
      await fetch(`${apiBase}/predict/${id}`, {
        method: 'DELETE'
      })
      setHistory(history.filter((h) => h.id !== id))
    } catch {
      const updated = history.filter((h) => h.id !== id)
      setHistory(updated)
      localStorage.setItem("prediction-history", JSON.stringify(updated))
    }
  }

  const handleClearAll = async () => {
    if (!confirm("确定要清空所有历史记录吗？")) return
    
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
    try {
      await fetch(`${apiBase}/predict/history`, {
        method: 'DELETE'
      })
      setHistory([])
    } catch {
      setHistory([])
      localStorage.setItem("prediction-history", "[]")
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
  }

  const getPredictionDisplay = (result: PredictionResult) => {
    if (typeof result.prediction === "number") {
      return (result.prediction * 100).toFixed(1) + "%"
    }
    return "-"
  }

  if (history.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-${compact ? "4" : "8"} text-center`}>
        <Clock className={`w-${compact ? "6" : "10"} h-${compact ? "6" : "10"} text-slate-300 mx-auto mb-${compact ? "2" : "3"}`} />
        <p className="text-xs text-slate-400">暂无历史记录</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.slice(0, 8).map((item) => {
          const status = getQualityStatus(
            typeof item.result.prediction === "number" ? item.result.prediction : 1
          )
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onSelect?.(item)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.color === "green" ? "bg-green-500" : status.color === "yellow" ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {formatTime(item.timestamp)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.params.heating_temperature?.toFixed(0)}°C / {item.params.forming_pressure?.toFixed(0)}MPa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${
                  status.color === "green" ? "text-green-600" : status.color === "yellow" ? "text-amber-600" : "text-red-600"
                }`}>
                  {getPredictionDisplay(item.result)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          )
        })}
        {history.length > 8 && (
          <p className="text-xs text-slate-400 text-center py-2">
            还有 {history.length - 8} 条记录
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">历史预测记录</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            title="刷新记录"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            刷新
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空记录
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left font-medium text-slate-600">时间</th>
                <th className="px-3 py-3 text-left font-medium text-slate-600">质量等级</th>
                <th className="px-3 py-3 text-left font-medium text-slate-600">缺陷概率</th>
                <th className="px-3 py-3 text-left font-medium text-slate-600">温度/压力</th>
                <th className="px-3 py-3 text-right font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item) => {
                const status = getQualityStatus(
                  typeof item.result.prediction === "number" ? item.result.prediction : 1
                )
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => onSelect?.(item)}
                  >
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatTime(item.timestamp)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          status.color === "green"
                            ? "bg-green-100 text-green-700"
                            : status.color === "yellow"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {getPredictionDisplay(item.result)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {item.params.heating_temperature ?? "-"}°C / {item.params.forming_pressure ?? "-"}MPa
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect?.(item)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
