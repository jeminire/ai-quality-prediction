import { useState, useCallback, useEffect, useRef, useMemo, ReactNode } from "react"
import { Brain, TrendingUp, Zap, Database, GitBranch, Eye, Globe, ArrowRight, Clock, BarChart3, ScatterChart, Lightbulb, Info, Activity, Shield, AlertTriangle, ChevronRight, Trash2, FileText, Download, Printer, FileSpreadsheet } from "lucide-react"

// 统计卡片组件
interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBg: string
  color: string
  percentage?: string
  label?: string
  percentageColor?: string
}

function StatCard({ title, value, icon, iconBg, color, percentage, label, percentageColor = 'text-slate-500' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        {percentage && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={`font-medium ${percentageColor}`}>{percentage}</span>
            <span className="text-slate-500">{label}</span>
          </div>
        )}
        {!percentage && label && (
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
            <Zap className="w-3 h-3" />
            <span>{label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
import { ParameterForm } from "./ParameterForm"
import { PredictionResultCard } from "./PredictionResult"
import { ProbabilityChart } from "./ProbabilityChart"
import { BatchPrediction } from "./BatchPrediction"
import { ShapFeatureChart } from "../RootCause/ShapFeatureChart"
import { ShapWaterfall } from "../RootCause/ShapWaterfall"
import { ShapBeeswarm } from "../RootCause/ShapBeeswarm"
import { RootCauseReport } from "../RootCause/RootCauseReport"
import { HistoryTable } from "../RootCause/HistoryTable"
import { useApi } from "@/hooks/useApi"
import type { ProcessParams, PredictionResult, MaterialBatchFeatures } from "@/types/prediction"
import { getQualityStatus } from "@/types/prediction"

const THRESHOLDS: Record<string, [number, number]> = {
  heating_temperature: [845, 855],
  forming_pressure: [117.5, 122.5],
  spindle_speed: [1450, 1550],
  coolant_flow: [23.8, 26.2],
  vibration_amplitude: [2.2, 2.8],
  current_intensity: [43.5, 46.5],
  mold_temperature: [177, 183],
  feed_rate: [290, 310],
  lubricant_flow: [14.2, 15.8],
  clamp_force: [78, 82],
}

const FEATURE_MAP: Record<string, string> = {
  heating_temperature: "加热温度",
  forming_pressure: "成型压力",
  spindle_speed: "主轴转速",
  coolant_flow: "冷却液流量",
  vibration_amplitude: "振动幅度",
  current_intensity: "电流强度",
  mold_temperature: "模具温度",
  feed_rate: "进给速度",
  lubricant_flow: "润滑剂流量",
  clamp_force: "夹紧力",
}

const UNIT_MAP: Record<string, string> = {
  heating_temperature: "°C",
  forming_pressure: "MPa",
  spindle_speed: "rpm",
  coolant_flow: "L/min",
  vibration_amplitude: "mm/s",
  current_intensity: "A",
  mold_temperature: "°C",
  feed_rate: "mm/min",
  lubricant_flow: "ml/min",
  clamp_force: "kN",
}

const VALUE_RANGE_MAP: Record<string, [number, number]> = {
  heating_temperature: [800, 900],
  forming_pressure: [100, 140],
  spindle_speed: [1000, 2000],
  coolant_flow: [20, 30],
  vibration_amplitude: [1, 4],
  current_intensity: [40, 50],
  mold_temperature: [170, 190],
  feed_rate: [250, 350],
  lubricant_flow: [12, 18],
  clamp_force: [70, 90],
}

interface ShapAnalysis {
  features: Array<{ feature: string; importance: number }>
  waterfall: Array<{ feature: string; value: number }>
  beeswarm: Array<{ feature: string; shapValue: number; featureValue: number; featureValueNormalized: number }>
  rootCauses: Array<{
    parameter: string
    currentValue: number
    unit: string
    recommendedRange: string
    impact: "high" | "medium" | "low"
    suggestion: string
  }>
}

interface HistoryItem {
  id: string
  timestamp: string
  params: ProcessParams
  result: PredictionResult
  material?: MaterialBatchFeatures
}

function mockPredict(params: ProcessParams): PredictionResult {
  let totalScore = 0

  for (const [key, [min, max]] of Object.entries(THRESHOLDS)) {
    const value = params[key as keyof ProcessParams]
    const center = (min + max) / 2
    const range = max - min
    if (value < min || value > max) {
      const score = Math.abs(value - center) / range
      totalScore += score
    }
  }

  const prediction = Math.min(0.99, totalScore / 5)
  const confidence = 0.75 + Math.random() * 0.2

  return {
    prediction_id: Math.floor(Math.random() * 1000000),
    prediction,
    confidence: Math.min(confidence, 0.99),
  }
}

function generateMockShapAnalysis(params: ProcessParams, result: PredictionResult): ShapAnalysis {
  const features = Object.entries(params).map(([key, value]) => {
    const [min, max] = THRESHOLDS[key]
    const center = (min + max) / 2
    const deviation = (value - center) / (max - min)
    const importance = deviation * (result.prediction > 0.7 ? 0.8 : result.prediction > 0.3 ? 0.5 : 0.2)
    return { feature: FEATURE_MAP[key], importance }
  })

  const waterfall = features.map((f) => ({ feature: f.feature, value: f.importance }))

  const beeswarm: Array<{ feature: string; shapValue: number; featureValue: number; featureValueNormalized: number }> = []
  Object.entries(params).forEach(([key, value]) => {
    const [min, max] = THRESHOLDS[key]
    const [globalMin, globalMax] = VALUE_RANGE_MAP[key]
    const center = (min + max) / 2
    const deviation = (value - center) / (max - min)

    beeswarm.push({
      feature: FEATURE_MAP[key],
      shapValue: deviation * (result.prediction > 0.7 ? 0.8 : result.prediction > 0.3 ? 0.5 : 0.2),
      featureValue: value,
      featureValueNormalized: (value - globalMin) / (globalMax - globalMin),
    })

    for (let i = 0; i < 8; i++) {
      const mockValue = globalMin + Math.random() * (globalMax - globalMin)
      const mockDeviation = (mockValue - center) / (max - min)
      beeswarm.push({
        feature: FEATURE_MAP[key],
        shapValue: mockDeviation * (Math.random() > 0.5 ? 0.6 : -0.4),
        featureValue: mockValue,
        featureValueNormalized: (mockValue - globalMin) / (globalMax - globalMin),
      })
    }
  })

  const rootCauses = Object.entries(params)
    .map(([key, value]) => {
      const [min, max] = THRESHOLD_MAP[key]
      if (value >= min && value <= max) return null
      const deviation = Math.abs(value - (value < min ? min : max)) / (max - min)
      const impact = deviation > 0.5 ? "high" : deviation > 0.2 ? "medium" : "low"
      const direction = value < min ? "提升" : "降低"
      return {
        parameter: FEATURE_MAP[key],
        currentValue: value,
        unit: UNIT_MAP[key],
        recommendedRange: `${min}-${max}`,
        impact,
        suggestion: `建议${direction}${FEATURE_MAP[key]}至${min}-${max}${UNIT_MAP[key]}范围，当前偏离${(deviation * 100).toFixed(0)}%`,
      }
    })
    .filter(Boolean) as ShapAnalysis["rootCauses"]

  return { features, waterfall, beeswarm, rootCauses }
}

function generateGlobalImportance(): Array<{ feature: string; importance: number }> {
  return [
    { feature: "成型压力", importance: 0.42 },
    { feature: "加热温度", importance: 0.28 },
    { feature: "电流强度", importance: 0.18 },
    { feature: "冷却液流量", importance: 0.15 },
    { feature: "主轴转速", importance: 0.12 },
    { feature: "振动幅度", importance: 0.10 },
    { feature: "模具温度", importance: 0.08 },
    { feature: "进给速度", importance: 0.08 },
    { feature: "润滑剂流量", importance: 0.06 },
    { feature: "夹紧力", importance: 0.05 },
  ].sort((a, b) => b.importance - a.importance)
}

const THRESHOLD_MAP = THRESHOLDS

export default function PredictionSection() {
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "rootcause">("single")
  const [realtimeMode, setRealtimeMode] = useState(() => {
    try {
      return localStorage.getItem("realtime-prediction-mode") === "true"
    } catch {
      return false
    }
  })

  // 根因分析相关状态
  const [shapData, setShapData] = useState<ShapAnalysis | null>(null)
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null)
  const [explainMode, setExplainMode] = useState<"local" | "global">("local")
  const [chartType, setChartType] = useState<"bar" | "beeswarm">("bar")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<"single" | "batch" | "history">("history")

  const historyStats = useMemo(() => {
    const passCount = history.filter(h => Number(h.result.prediction) < 0.3).length
    const failCount = history.filter(h => Number(h.result.prediction) >= 0.3).length
    const passRate = history.length > 0 ? (passCount / history.length) * 100 : 0
    const failRate = history.length > 0 ? (failCount / history.length) * 100 : 0
    const avgConfidence = history.length > 0
      ? (history.reduce((acc, h) => acc + (Number(h.result.confidence) || 0), 0) / history.length) * 100
      : 0
    const maxConfidence = history.length > 0
      ? Math.max(...history.map(h => Number(h.result.confidence) || 0)) * 100
      : 0
    const minConfidence = history.length > 0
      ? Math.min(...history.map(h => Number(h.result.confidence) || 0)) * 100
      : 0
    return { passCount, failCount, passRate, failRate, avgConfidence, maxConfidence, minConfidence }
  }, [history])

  // 加载历史预测数据
  const loadHistory = useCallback(async () => {
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
        console.log('Loaded history from API:', apiHistory.length, 'records')
      } else {
        const stored = JSON.parse(localStorage.getItem("prediction-history") || "[]")
        setHistory(stored)
        console.log('Loaded history from localStorage:', stored.length, 'records')
      }
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem("prediction-history") || "[]")
      setHistory(stored)
      console.log('Loaded history from localStorage (fallback):', stored.length, 'records')
    }
  }, [])

  // 组件挂载时加载历史数据，并添加定时刷新
  useEffect(() => {
    loadHistory()
    
    // 定时刷新历史数据（每30秒）
    const interval = setInterval(() => {
      if (activeTab === "rootcause") {
        loadHistory()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadHistory, activeTab])

  const toggleRealtime = () => {
    setRealtimeMode((prev: boolean) => {
      const next = !prev
      try {
        localStorage.setItem("realtime-prediction-mode", String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const { call, loading, api } = useApi()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runPrediction = useCallback(
    async (params: ProcessParams, material?: MaterialBatchFeatures, saveHistory = true): Promise<PredictionResult> => {
      // 构建预测请求数据
      const requestData: { features: ProcessParams; material?: MaterialBatchFeatures } = { features: params }
      if (material) {
        requestData.material = material
      }
      
      const data = await call(() => api.post<PredictionResult>("/predict/", requestData))
      const finalResult = data || mockPredict(params)
      setResult(finalResult)

      if (saveHistory) {
        const newRecord = {
          id: finalResult.prediction_id?.toString() || Date.now().toString(),
          timestamp: new Date().toISOString(),
          params,
          result: finalResult,
          material: material,
        }
        
        // 更新本地 history 状态
        setHistory(prev => [newRecord, ...prev])
        
        // 预测完成后重新从后端加载历史数据，确保数据一致性
        setTimeout(() => {
          loadHistory()
        }, 500)
      }

      return finalResult
    },
    [call, api, loadHistory]
  )

  const handlePredict = useCallback(
    async (params: ProcessParams, material?: MaterialBatchFeatures) => {
      await runPrediction(params, material, true)
    },
    [runPrediction]
  )

  const handleParamChange = useCallback(
    (params: ProcessParams, material?: MaterialBatchFeatures) => {
      if (!realtimeMode) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        runPrediction(params, material, false)
      }, 300)
    },
    [realtimeMode, runPrediction]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleBatchPredict = useCallback(
    async (params: ProcessParams): Promise<PredictionResult | null> => {
      const data = await call(() => api.post<PredictionResult>("/predict/", { features: params }))
      return data || mockPredict(params)
    },
    [call, api]
  )

  const handleSelectHistory = useCallback(
    (item: HistoryItem) => {
      // 设置选中的历史记录
      setSelectedHistory(item)
      
      // 生成 SHAP 分析数据（与 handleViewAnalysis 保持一致）
      const shapAnalysis = generateMockShapAnalysis(item.params, item.result)
      setShapData(shapAnalysis)
    },
    []
  )

  // 查看历史记录的根因分析
  const handleViewAnalysis = useCallback(
    async (item: HistoryItem) => {
      // 设置选中的历史记录
      setSelectedHistory(item)
      
      // 生成 SHAP 分析数据
      const shapAnalysis = generateMockShapAnalysis(item.params, item.result)
      setShapData(shapAnalysis)
      
      // 切换到根因分析页面
      setActiveTab("rootcause")
    },
    []
  )

  // 删除历史记录
  const handleDeleteHistory = useCallback(
    async (id: string) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
      try {
        await fetch(`${apiBase}/predict/${id}`, {
          method: 'DELETE'
        })
        setHistory(prev => prev.filter(h => h.id !== id))
      } catch {
        setHistory(prev => {
          const updated = prev.filter(h => h.id !== id)
          localStorage.setItem("prediction-history", JSON.stringify(updated))
          return updated
        })
      }
    },
    []
  )

  // 生成质量分析报告
  const generateQualityReport = useCallback(() => {
    setShowReportModal(true)
    setReportType("history")
  }, [])

  // 导出报告为CSV
  const exportReportCSV = useCallback(() => {
    const headers = [
      '序号', '时间戳', '预测结果', '缺陷概率', '置信度',
      '加热温度(°C)', '成型压力(MPa)', '主轴转速(rpm)', '冷却液流量(L/min)',
      '振动幅度(mm/s)', '电流强度(A)', '模具温度(°C)', '进给速度(mm/min)',
      '润滑剂流量(ml/min)', '夹紧力(kN)'
    ]
    
    const rows = history.map((item, index) => [
      index + 1,
      item.timestamp,
      (item.result.prediction as number) < 0.3 ? '合格' : '不合格',
      ((item.result.prediction as number) * 100).toFixed(1) + '%',
      ((item.result.confidence as number) * 100).toFixed(1) + '%',
      item.params.heating_temperature || '',
      item.params.forming_pressure || '',
      item.params.spindle_speed || '',
      item.params.coolant_flow || '',
      item.params.vibration_amplitude || '',
      item.params.current_intensity || '',
      item.params.mold_temperature || '',
      item.params.feed_rate || '',
      item.params.lubricant_flow || '',
      item.params.clamp_force || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `质量分析报告_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('报告导出成功！')
  }, [history])

  // 打印报告
  const printReport = useCallback(() => {
    const getPrediction = (prediction: unknown) => Number(prediction)
    const passCount = history.filter(h => getPrediction(h.result.prediction) < 0.3).length
    const failCount = history.filter(h => getPrediction(h.result.prediction) >= 0.3).length
    const passRate = history.length > 0 ? ((passCount / history.length) * 100).toFixed(1) : "0"

    const printContent = `
      <html>
        <head>
          <title>质量分析报告</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>AI质量预测分析报告</h1>
          <div class="summary">
            <p><strong>报告生成时间：</strong>${new Date().toLocaleString()}</p>
            <p><strong>总预测次数：</strong>${history.length} 次</p>
            <p><strong>合格次数：</strong>${passCount} 次</p>
            <p><strong>不合格次数：</strong>${failCount} 次</p>
            <p><strong>合格率：</strong>${passRate}%</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>时间戳</th>
                <th>预测结果</th>
                <th>缺陷概率</th>
                <th>置信度</th>
              </tr>
            </thead>
            <tbody>
              ${history.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.timestamp}</td>
                  <td>${getPrediction(item.result.prediction) < 0.3 ? '合格' : '不合格'}</td>
                  <td>${(getPrediction(item.result.prediction) * 100).toFixed(1)}%</td>
                  <td>${(Number(item.result.confidence) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>卓越汽车零部件有限公司 - AI质量预测与智能管控系统</p>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }, [history])

  useEffect(() => {
    if (selectedHistory && !shapData) {
      setShapData(generateMockShapAnalysis(selectedHistory.params, selectedHistory.result))
    }
  }, [selectedHistory, shapData])

  const globalImportance = generateGlobalImportance()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI质量预测与根因分析</h1>
            <p className="text-sm text-slate-500">输入工艺参数获取AI预测，分析质量问题根因</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("single")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "single"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" />
            单条预测
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "batch"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Database className="w-4 h-4" />
            批量预测
          </button>
          <button
            onClick={() => setActiveTab("rootcause")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "rootcause"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            根因分析
          </button>
        </div>
      </div>

      {/* 单条预测 */}
      {activeTab === "single" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">工艺参数输入</h2>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-slate-500">实时预测</span>
                  <div
                    onClick={toggleRealtime}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      realtimeMode ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: realtimeMode ? "translateX(18px)" : "translateX(2px)" }}
                    />
                  </div>
                </label>
              </div>
              <ParameterForm
                onPredict={handlePredict}
                onParamChange={handleParamChange}
                loading={loading}
                realtimeMode={realtimeMode}
              />
            </div>

            <div className="space-y-6">
              <PredictionResultCard result={result} />
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <ProbabilityChart result={result} />
              </div>
            </div>
          </div>

          {/* 历史预测数据 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  历史预测记录
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  共 {history.length} 条记录
                </span>
              </div>
            </div>
            <div className="p-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无历史预测记录</p>
                  <p className="text-xs mt-1">完成预测后会自动保存到历史记录</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {history.slice(0, 10).map((item, index) => {
                    const prediction = item.result.prediction as number
                    const confidence = item.result.confidence as number
                    const quality = getQualityStatus(prediction)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            prediction < 0.3 ? 'bg-green-500' : prediction < 0.7 ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {quality.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(item.timestamp).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">缺陷概率</p>
                            <p className={`font-medium ${
                              prediction < 0.3 ? 'text-green-600' : prediction < 0.7 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {(prediction * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">置信度</p>
                            <p className="font-medium text-slate-700">
                              {confidence ? (confidence * 100).toFixed(1) : '-'}%
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewAnalysis(item)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            分析详情
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="删除这条记录"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {history.length > 10 && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setActiveTab("rootcause")}
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    查看更多历史记录 →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 批量预测 */}
      {activeTab === "batch" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Database className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">批量预测</h2>
          </div>
          <BatchPrediction onPredict={handleBatchPredict} />
        </div>
      )}

      {/* 根因分析 */}
      {activeTab === "rootcause" && (
        <div className="space-y-6">
          {/* 历史预测数据统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="总预测次数"
              value={history.length}
              icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
              iconBg="bg-blue-100"
              color="text-slate-800"
            />

            <StatCard
              title="合格预测"
              value={historyStats.passCount}
              icon={<Shield className="w-6 h-6 text-green-600" />}
              iconBg="bg-green-100"
              color="text-green-600"
              percentage={`${historyStats.passRate.toFixed(1)}%`}
              label="合格率"
              percentageColor="text-green-600"
            />

            <StatCard
              title="不合格预测"
              value={historyStats.failCount}
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
              iconBg="bg-red-100"
              color="text-red-600"
              percentage={`${historyStats.failRate.toFixed(1)}%`}
              label="不合格率"
              percentageColor="text-red-600"
            />

            <StatCard
              title="平均置信度"
              value={`${historyStats.avgConfidence.toFixed(1)}%`}
              icon={<Activity className="w-6 h-6 text-purple-600" />}
              iconBg="bg-purple-100"
              color="text-slate-800"
              label="模型可靠性"
            />
          </div>

          {/* 报告生成与导出 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-800">质量分析报告</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportReportCSV}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  导出CSV报告
                </button>
                <button
                  onClick={printReport}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  打印报告
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">CSV数据报告</p>
                    <p className="text-xs text-slate-500 mt-1">包含完整工艺参数与预测结果</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Printer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">打印报告</p>
                    <p className="text-xs text-slate-500 mt-1">适合存档追溯与打印留档</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">历史数据分析</p>
                    <p className="text-xs text-slate-500 mt-1">基于{history.length}条历史预测记录</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 预测趋势图表 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  预测趋势分析
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></div>
                    <span className="text-xs text-slate-600 font-medium">合格 (&lt; 30%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm"></div>
                    <span className="text-xs text-slate-600 font-medium">风险 (30% - 70%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm"></div>
                    <span className="text-xs text-slate-600 font-medium">不合格 (≥ 70%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              {history.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">暂无预测数据</p>
                    <p className="text-slate-300 text-xs mt-1">进行预测后将显示趋势图表</p>
                  </div>
                </div>
              ) : (
                <div className="relative h-72 overflow-visible">
                  {/* 左侧Y轴标签 */}
                  <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between text-xs text-slate-400 z-10 bg-white/50">
                    <span className="font-semibold text-blue-600">100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  {/* 图表主体区域 */}
                  <div className="absolute left-12 right-0 top-0 bottom-4">
                    {/* 网格背景 */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 25, 50, 75, 100].map((value, index) => (
                        <div key={value} className="relative border-t border-slate-100">
                          <div className={`absolute left-0 right-0 h-px ${index % 2 === 0 ? 'bg-slate-100' : 'bg-slate-50'}`}></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 阈值区域 */}
                    <div className="absolute left-0 right-0 top-0 h-[30%] bg-gradient-to-b from-green-50/60 to-transparent border-b border-green-200/50">
                      <span className="absolute top-1 right-1 text-[10px] text-green-600 font-medium bg-white/80 px-1.5 py-0.5 rounded shadow-sm">
                        合格
                      </span>
                    </div>
                    <div className="absolute left-0 right-0 top-[30%] h-[40%] bg-gradient-to-b from-amber-50/60 via-amber-50/40 to-amber-50/20 border-y border-amber-200/50">
                      <span className="absolute top-1 right-1 text-[10px] text-amber-600 font-medium bg-white/80 px-1.5 py-0.5 rounded shadow-sm">
                        风险
                      </span>
                    </div>
                    <div className="absolute left-0 right-0 top-[70%] h-[30%] bg-gradient-to-t from-red-50/60 to-transparent border-t border-red-200/50">
                      <span className="absolute bottom-1 right-1 text-[10px] text-red-600 font-medium bg-white/80 px-1.5 py-0.5 rounded shadow-sm">
                        不合格
                      </span>
                    </div>
                    
                    {/* SVG 折线图 */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* 渐变定义 */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.15)" />
                          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* 填充区域 */}
                      <path
                        d={`M ${history.slice(-20).map((item, index) => {
                          const x = (index / Math.max(history.slice(-20).length - 1, 1)) * 100
                          const y = 100 - ((item.result.prediction as number) * 100)
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')} L 100 100 L 0 100 Z`}
                        fill="url(#areaGradient)"
                        className="transition-all duration-500"
                      />
                      
                      {/* 折线 */}
                      <path
                        d={history.slice(-20).map((item, index) => {
                          const x = (index / Math.max(history.slice(-20).length - 1, 1)) * 100
                          const y = 100 - ((item.result.prediction as number) * 100)
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="transition-all duration-500"
                      >
                        <animate attributeName="d" dur="0.5s" fill="freeze" />
                      </path>
                    </svg>
                    
                    {/* 数据点和交互提示 */}
                    {history.slice(-20).map((item, index) => {
                      const prediction = item.result.prediction as number
                      const xPercent = (index / Math.max(history.slice(-20).length - 1, 1)) * 100
                      const yPercent = 100 - (prediction * 100)
                      const isGreen = prediction < 0.3
                      const isAmber = prediction >= 0.3 && prediction < 0.7
                      const isRed = prediction >= 0.7
                      
                      return (
                        <div
                          key={item.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                          style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                        >
                          {/* 数据点 */}
                          <div
                            className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-150 ${
                              isGreen 
                                ? 'bg-gradient-to-br from-green-400 to-green-600' 
                                : isAmber 
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                  : 'bg-gradient-to-br from-red-400 to-red-600'
                            }`}
                          />
                          
                          {/* 悬停提示 - 调整到右侧 */}
                          <div className="absolute left-full bottom-0 ml-2 mb-2 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl z-30">
                            <div className="font-medium mb-1">{new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                            <div className={`font-bold ${isGreen ? 'text-green-300' : isAmber ? 'text-amber-300' : 'text-red-300'}`}>
                              缺陷概率: {(prediction * 100).toFixed(1)}%
                            </div>
                            <div className="text-slate-400 text-[10px]">置信度: {((item.result.confidence as number) * 100).toFixed(1)}%</div>
                            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* X轴标签 */}
                  <div className="absolute left-12 right-0 bottom-0 h-4 flex items-center justify-between text-[10px] text-slate-400 z-10">
                    {history.slice(-20).filter((_, index) => index % Math.ceil(history.slice(-20).length / 6) === 0).map((item, idx, arr) => {
                      const originalIndex = history.slice(-20).findIndex(h => h.id === item.id)
                      const xPercent = (originalIndex / Math.max(history.slice(-20).length - 1, 1)) * 100
                      return (
                        <span 
                          key={item.id} 
                          className="transform -translate-x-1/2"
                          style={{ position: 'absolute', left: `${xPercent}%` }}
                        >
                          {new Date(item.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {history.length > 20 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>显示最近 20 条记录</span>
                  <span className="text-slate-300">|</span>
                  <span>共 {history.length} 条记录</span>
                </div>
              )}
            </div>
          </div>

          {/* 历史记录 - 始终渲染以加载数据 */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* 左侧栏：历史记录 */}
            <div className="xl:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      历史记录
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.slice(0, 8).map((item) => {
                      const status = getQualityStatus(
                        typeof item.result.prediction === "number" ? item.result.prediction : 1
                      )
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectHistory(item)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                status.color === "green" ? "bg-green-500" : status.color === "yellow" ? "bg-amber-500" : "bg-red-500"
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">
                                {new Date(item.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                              {typeof item.result.prediction === "number" ? (item.result.prediction * 100).toFixed(1) + "%" : "-"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteHistory(item.id)
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                </div>
              </div>
            </div>

            {/* 右侧主区域 */}
            <div className="xl:col-span-3">
              {selectedHistory ? (
                <div className="space-y-6">
                  {/* 当前分析数据标题 */}
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-500">预测时间</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">
                          {new Date(selectedHistory.timestamp).toLocaleString('zh-CN', { 
                            year: 'numeric',
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-500">关键参数</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedHistory.params.heating_temperature?.toFixed(0)}°C / {selectedHistory.params.forming_pressure?.toFixed(0)}MPa
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-500">预测结果</span>
                        </div>
                        <p className={`text-lg font-semibold ${
                          typeof selectedHistory.result.prediction === "number" && selectedHistory.result.prediction < 0.3 
                            ? 'text-green-600' 
                            : typeof selectedHistory.result.prediction === "number" && selectedHistory.result.prediction < 0.7 
                              ? 'text-amber-600' 
                              : 'text-red-600'
                        }`}>
                          {typeof selectedHistory.result.prediction === "number" 
                            ? `${(selectedHistory.result.prediction * 100).toFixed(1)}%` 
                            : '-'}
                          <span className="text-xs font-normal text-slate-500 ml-1">缺陷概率</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 顶部工具栏 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setExplainMode("local")}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          explainMode === "local"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        局部解释
                      </button>
                      <button
                        onClick={() => setExplainMode("global")}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          explainMode === "global"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        全局解释
                      </button>
                    </div>

                    {explainMode === "local" && (
                      <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => setChartType("bar")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            chartType === "bar"
                              ? "bg-white text-slate-800 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          条形图
                        </button>
                        <button
                          onClick={() => setChartType("beeswarm")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            chartType === "beeswarm"
                              ? "bg-white text-slate-800 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <ScatterChart className="w-3.5 h-3.5" />
                          蜂群图
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 图表区域 */}
                  {explainMode === "local" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* SHAP特征重要性 */}
                      <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            SHAP特征重要性
                          </h3>
                        </div>
                        <div className="p-4">
                          {chartType === "bar" ? (
                            <ShapFeatureChart data={shapData?.features || null} />
                          ) : (
                            <ShapBeeswarm data={shapData?.beeswarm || null} />
                          )}
                        </div>
                      </div>

                      {/* SHAP瀑布图 */}
                      <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                            SHAP瀑布图（预测路径）
                          </h3>
                        </div>
                        <div className="p-4">
                          <ShapWaterfall data={shapData?.waterfall || null} baseValue={0.5} />
                        </div>
                      </div>

                      {/* 根因报告 */}
                      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="p-4">
                          <RootCauseReport data={shapData?.rootCauses || null} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 全局特征重要性 */}
                      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-500" />
                            全局特征重要性
                          </h3>
                        </div>
                        <div className="p-6">
                          <ShapFeatureChart
                            data={globalImportance.map((item) => ({
                              feature: item.feature,
                              importance: item.importance,
                            }))}
                          />
                          <p className="text-xs text-slate-400 mt-4 text-center">
                            基于模型训练数据集的整体特征重要性分析 | 数值越大表示该特征对质量预测的影响越强
                          </p>
                        </div>
                      </div>

                      {/* 全局解释说明 */}
                      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-500" />
                            SHAP解释说明
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <GitBranch className="w-4 h-4 text-blue-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-blue-800">局部 vs 全局</h4>
                              </div>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                局部解释展示单次预测中各参数的具体贡献，全局解释展示模型整体对各特征的依赖程度。
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                  <Activity className="w-4 h-4 text-red-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-red-800">SHAP值含义</h4>
                              </div>
                              <p className="text-xs text-red-700 leading-relaxed">
                                正值（红色）表示该特征推高风险，负值（绿色）表示降低风险。绝对值越大，影响越强。
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-green-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-green-800">模型可靠性</h4>
                              </div>
                              <p className="text-xs text-green-700 leading-relaxed">
                                本模型基于历史生产数据训练，特征重要性已通过交叉验证确认。建议结合工艺专家知识综合判断。
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-200 flex items-center justify-center">
                    <GitBranch className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">选择历史记录查看分析</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
                    从左侧历史记录列表中选择一条预测记录，即可查看详细的SHAP根因分析结果
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 报告预览模态框 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">质量分析报告预览</h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* 报告头部信息 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">AI质量预测分析报告</h3>
                    <p className="text-sm text-slate-600 mt-1">卓越汽车零部件有限公司</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">报告生成时间</p>
                    <p className="text-sm text-slate-600">{new Date().toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">总预测次数</p>
                    <p className="text-2xl font-bold text-blue-600">{history.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">合格次数</p>
                    <p className="text-2xl font-bold text-green-600">
                      {historyStats.passCount}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">不合格次数</p>
                    <p className="text-2xl font-bold text-red-600">
                      {historyStats.failCount}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">合格率</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {historyStats.passRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* 质量分布饼图 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">质量分布统计</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-slate-600">合格产品</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {historyStats.passCount} 次
                        ({historyStats.passRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${historyStats.passRate}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-slate-600">不合格产品</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {historyStats.failCount} 次
                        ({historyStats.failRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${historyStats.failRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">置信度分析</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">平均置信度</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {historyStats.avgConfidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${historyStats.avgConfidence}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-slate-600">最高置信度</span>
                      <span className="text-sm font-semibold text-green-600">
                        {historyStats.maxConfidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">最低置信度</span>
                      <span className="text-sm font-semibold text-red-600">
                        {historyStats.minConfidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 预测历史记录表 */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-700">预测历史记录</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">序号</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">时间戳</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">预测结果</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">缺陷概率</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">置信度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.slice(0, 20).map((item, index) => {
                        const prediction = item.result.prediction as number
                        const confidence = item.result.confidence as number
                        const qualityStatus = prediction < 0.3 ? '合格' : prediction < 0.7 ? '风险' : '不合格'
                        const qualityColor = prediction < 0.3 ? 'text-green-600 bg-green-50' : prediction < 0.7 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{new Date(item.timestamp).toLocaleString('zh-CN')}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityColor}`}>
                                {qualityStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">{(prediction * 100).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{(confidence * 100).toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {history.length > 20 && (
                  <div className="px-4 py-3 border-t border-slate-200 text-center text-sm text-slate-500">
                    显示前20条记录，共{history.length}条记录
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-sm text-slate-500">
                * 完整报告请使用"导出CSV报告"或"打印报告"功能
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={exportReportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  导出CSV
                </button>
                <button
                  onClick={printReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  打印报告
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}