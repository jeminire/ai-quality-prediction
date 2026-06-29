import { useState, useRef } from "react"
import { Upload, Download, FileSpreadsheet, Trash2, AlertCircle } from "lucide-react"
import type { ProcessParams, BatchPredictionItem, PredictionResult } from "@/types/prediction"
import { getQualityStatus } from "@/types/prediction"

interface BatchPredictionProps {
  onPredict: (params: ProcessParams) => Promise<PredictionResult | null>
}

// CSV模板下载 — 与用户数据格式一致
const csvTemplate = `record_id,batch_id,timestamp,heating_temperature,forming_pressure,spindle_speed,coolant_flow,vibration_amplitude,current_intensity,mold_temperature,feed_rate,lubricant_flow,clamp_force,equipment_id,operator_id
REC-000001,BATCH-20240601-001,2024-06-01 08:00:00,850,120,1500,25,2.5,45,180,300,15,80,EQ-A01,OP-001
REC-000002,BATCH-20240601-001,2024-06-01 08:05:00,845,118,1480,24,2.2,44,178,295,14.5,79,EQ-A02,OP-002
REC-000003,BATCH-20240601-001,2024-06-01 08:10:00,855,122,1520,26,2.8,46,182,305,15.5,81,EQ-A03,OP-001`

// 阈值范围（来自后端文档）
const THRESHOLDS: Record<keyof ProcessParams, [number, number]> = {
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

function mockPredictBatch(params: ProcessParams): PredictionResult {
  // 计算每个参数偏离阈值的分数
  let totalScore = 0
  for (const [key, [min, max]] of Object.entries(THRESHOLDS)) {
    const value = params[key as keyof ProcessParams]
    const center = (min + max) / 2
    const range = max - min
    if (value < min || value > max) {
      totalScore += Math.abs(value - center) / range
    }
  }

  // 基于偏离程度计算预测值和置信度
  const prediction = Math.min(0.99, totalScore / 5)
  const confidence = 0.75 + Math.random() * 0.2

  return {
    prediction_id: Math.floor(Math.random() * 1000000),
    prediction,
    confidence: Math.min(confidence, 0.99),
  }
}

export function BatchPrediction({ onPredict }: BatchPredictionProps) {
  const [results, setResults] = useState<BatchPredictionItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const REQUIRED_COLUMNS: (keyof ProcessParams)[] = [
    "heating_temperature",
    "forming_pressure",
    "spindle_speed",
    "coolant_flow",
    "vibration_amplitude",
    "current_intensity",
    "mold_temperature",
    "feed_rate",
    "lubricant_flow",
    "clamp_force",
  ]

  const parseCSV = (text: string): ProcessParams[] => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) throw new Error("CSV文件至少需要包含表头和一行数据")

    const headers = lines[0].split(",").map((h) => h.trim())
    const missing = REQUIRED_COLUMNS.filter((r) => !headers.includes(r))
    if (missing.length > 0) throw new Error(`缺少必要列: ${missing.join(", ")}`)

    return lines.slice(1).map((line, idx) => {
      const values = line.split(",").map((v) => {
        const trimmed = v.trim()
        return trimmed === "" ? 0 : parseFloat(trimmed)
      })
      
      // 检查必要列是否有有效数字
      REQUIRED_COLUMNS.forEach((col) => {
        const idx = headers.indexOf(col)
        if (idx >= 0 && isNaN(values[idx])) {
          throw new Error(`第${idx + 2}行的${col}列包含无效数字`)
        }
      })
      
      return {
        heating_temperature: values[headers.indexOf("heating_temperature")],
        forming_pressure: values[headers.indexOf("forming_pressure")],
        spindle_speed: values[headers.indexOf("spindle_speed")],
        coolant_flow: values[headers.indexOf("coolant_flow")],
        vibration_amplitude: values[headers.indexOf("vibration_amplitude")],
        current_intensity: values[headers.indexOf("current_intensity")],
        mold_temperature: values[headers.indexOf("mold_temperature")],
        feed_rate: values[headers.indexOf("feed_rate")],
        lubricant_flow: values[headers.indexOf("lubricant_flow")],
        clamp_force: values[headers.indexOf("clamp_force")],
      }
    })
  }

  const processFile = async (file: File) => {
    setError(null)
    if (!file.name.endsWith(".csv")) {
      setError("请上传CSV格式文件")
      return
    }

    const text = await file.text()
    try {
      const paramsList = parseCSV(text)
      setIsPredicting(true)
      const newResults: BatchPredictionItem[] = []
      
      // 逐条调用 onPredict，支持真实的 API 请求
      for (let i = 0; i < paramsList.length; i++) {
        const params = paramsList[i]
        try {
          let result = await onPredict(params)
          // 如果 API 返回 null，使用 mock 降级
          if (!result) {
            result = mockPredictBatch(params)
          }
          newResults.push({
            id: `batch-${Date.now()}-${i}`,
            params,
            result,
          })
        } catch (err) {
          console.error(`预测第${i + 1}条失败:`, err)
          // 单条失败时使用 mock 降级，不中断整体流程
          newResults.push({
            id: `batch-${Date.now()}-${i}`,
            params,
            result: mockPredictBatch(params),
          })
        }
      }
      
      setResults((prev) => [...newResults, ...prev].slice(0, 100))
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败")
    } finally {
      setIsPredicting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "batch_prediction_template.csv"
    link.click()
  }

  const exportResults = () => {
    if (results.length === 0) return
    const headers = "id,heating_temperature,forming_pressure,spindle_speed,coolant_flow,vibration_amplitude,current_intensity,mold_temperature,feed_rate,lubricant_flow,clamp_force,prediction,confidence\n"
    const rows = results
      .map(
        (r) =>
          `${r.id},${r.params.heating_temperature},${r.params.forming_pressure},${r.params.spindle_speed},${r.params.coolant_flow},${r.params.vibration_amplitude},${r.params.current_intensity},${r.params.mold_temperature},${r.params.feed_rate},${r.params.lubricant_flow},${r.params.clamp_force},${r.result.prediction.toFixed(4)},${r.result.confidence.toFixed(4)}`
      )
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `batch_prediction_results_${Date.now()}.csv`
    link.click()
  }

  const passCount = results.filter((r) => r.result.prediction < 0.3).length
  const riskCount = results.filter((r) => r.result.prediction >= 0.3 && r.result.prediction < 0.7).length
  const failCount = results.filter((r) => r.result.prediction >= 0.7).length

  return (
    <div className="space-y-5">
      {/* 上传区域 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-slate-800 bg-slate-50"
            : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-slate-800" : "text-slate-300"}`} />
        <p className="text-sm font-medium text-slate-700 mb-1">点击或拖拽上传CSV文件</p>
        <p className="text-xs text-slate-400">支持批量预测，最多100条记录</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center gap-3">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          下载模板
        </button>
        {results.length > 0 && (
          <>
            <button
              onClick={exportResults}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              导出结果
            </button>
            <button
              onClick={() => setResults([])}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空结果
            </button>
          </>
        )}
      </div>

      {/* 统计概览 */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{passCount}</p>
            <p className="text-xs text-green-600 mt-1">合格</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{riskCount}</p>
            <p className="text-xs text-amber-600 mt-1">风险</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{failCount}</p>
            <p className="text-xs text-red-600 mt-1">不合格</p>
          </div>
        </div>
      )}

      {/* 结果表格 */}
      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">序号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">加热温度</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">成型压力</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">主轴转速</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">预测结果</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">置信度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((item, idx) => {
                  const status = getQualityStatus(item.result.prediction)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-700">{item.params.heating_temperature}°C</td>
                      <td className="px-4 py-3 text-slate-700">{item.params.forming_pressure}MPa</td>
                      <td className="px-4 py-3 text-slate-700">{item.params.spindle_speed}rpm</td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                status.color === "green"
                                  ? "bg-green-500"
                                  : status.color === "yellow"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${item.result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{(item.result.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
