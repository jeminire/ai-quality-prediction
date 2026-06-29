import { useState, useEffect, useRef } from "react"
import { X, AlertTriangle, CheckCircle2, Thermometer, Gauge, Activity } from "lucide-react"
import ReactECharts from "echarts-for-react"
import type { BatchData } from "../../types/dashboard"

interface DashboardBatchDetailProps {
  batch: BatchData | null
  onClose: () => void
}

interface ShapItem {
  feature: string
  contribution: number
  value: number
}

const featureLabels: Record<string, string> = {
  forming_pressure: "成型压力",
  heating_temperature: "加热温度",
  coolant_flow: "冷却液流量",
  vibration_amplitude: "振动幅度",
  spindle_speed: "主轴转速",
  current_intensity: "电流强度",
  mold_temperature: "模具温度",
  feed_rate: "进给速度",
  lubricant_flow: "润滑剂流量",
  clamp_force: "夹紧力",
}

export function DashboardBatchDetail({ batch, onClose }: DashboardBatchDetailProps) {
  const [shapData, setShapData] = useState<ShapItem[]>([])
  const [prediction, setPrediction] = useState<number | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!batch) return
    
    if (isMounted.current) {
      setShapData([
        { feature: "heating_temperature", contribution: 0.25, value: batch.temperature },
        { feature: "forming_pressure", contribution: 0.15, value: batch.pressure },
        { feature: "spindle_speed", contribution: -0.1, value: batch.speed },
        { feature: "coolant_flow", contribution: 0.08, value: 25.2 },
        { feature: "vibration_amplitude", contribution: -0.05, value: 2.3 },
      ])
      
      setPrediction(batch.passRate / 100)
    }
  }, [batch])

  if (!batch) return null

  const shapOption = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0]
        const val = p.value
        const color = val > 0 ? "#ef4444" : "#22c55e"
        return `${p.name}<br/>贡献值: <span style="color:${color}">${val > 0 ? "+" : ""}${val.toFixed(3)}</span>`
      },
    },
    grid: { left: 90, right: 20, top: 15, bottom: 15 },
    xAxis: {
      type: "value" as const,
      axisLabel: { formatter: (v: number) => v.toFixed(2), fontSize: 10 },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "category" as const,
      data: [...shapData].reverse().map((d) => featureLabels[d.feature] || d.feature),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar" as const,
        data: [...shapData].reverse().map((d) => ({
          value: d.contribution,
          itemStyle: {
            color: d.contribution > 0 ? "#ef4444" : "#22c55e",
            borderRadius: 3,
          },
        })),
        barMaxWidth: 20,
        label: {
          show: true,
          position: "right" as const,
          formatter: (p: { value: number }) => `${p.value > 0 ? "+" : ""}${p.value.toFixed(3)}`,
          fontSize: 10,
        },
      },
    ],
  }

  const getQualityStatus = () => {
    switch (batch.qualityLevel) {
      case 'pass':
        return { label: '合格', color: 'bg-green-100 text-green-700' as const, icon: <CheckCircle2 className="h-3 w-3" /> }
      case 'risk':
        return { label: '风险', color: 'bg-amber-100 text-amber-700' as const, icon: <AlertTriangle className="h-3 w-3" /> }
      default:
        return { label: '不合格', color: 'bg-red-100 text-red-700' as const, icon: <AlertTriangle className="h-3 w-3" /> }
    }
  }

  const qualityStatus = getQualityStatus()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">批次详情</h3>
            <span className="font-mono text-xs text-blue-600">{batch.batchNo}</span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${qualityStatus.color}`}>
              {qualityStatus.icon}
              {qualityStatus.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded bg-slate-50 p-2">
              <p className="text-xs text-slate-500">日期</p>
              <p className="text-sm font-medium">{new Date(batch.date).toLocaleDateString()}</p>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <p className="text-xs text-slate-500">班次</p>
              <p className="text-sm font-medium">{batch.shift}</p>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <p className="text-xs text-slate-500">生产线</p>
              <p className="text-sm font-medium">{batch.productionLine}</p>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <p className="text-xs text-slate-500">操作员</p>
              <p className="text-sm font-medium">{batch.operator}</p>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <h4 className="text-xs font-medium text-slate-700 mb-2">实时工艺参数</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 rounded bg-red-50 p-2">
                <div className="rounded-full bg-red-100 p-1.5">
                  <Thermometer className="h-3 w-3 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">温度</p>
                  <p className="font-semibold text-slate-800 text-sm">{batch.temperature.toFixed(1)}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded bg-blue-50 p-2">
                <div className="rounded-full bg-blue-100 p-1.5">
                  <Gauge className="h-3 w-3 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">压力</p>
                  <p className="font-semibold text-slate-800 text-sm">{batch.pressure.toFixed(1)}MPa</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded bg-green-50 p-2">
                <div className="rounded-full bg-green-100 p-1.5">
                  <Activity className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">转速</p>
                  <p className="font-semibold text-slate-800 text-sm">{batch.speed.toFixed(0)}rpm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <h4 className="text-xs font-medium text-slate-700 mb-2">AI 质量预测</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-600">合格概率</span>
                  <span className={`font-semibold text-sm ${prediction !== null && prediction >= 0.7 ? 'text-green-600' : prediction !== null && prediction >= 0.4 ? 'text-amber-600' : 'text-red-600'}`}>
                    {prediction !== null ? `${(prediction * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${prediction !== null && prediction >= 0.7 ? 'bg-green-500' : prediction !== null && prediction >= 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: prediction !== null ? `${prediction * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-xs text-slate-500">合格率</p>
                <p className="text-lg font-bold text-slate-800">{batch.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <h4 className="text-xs font-medium text-slate-700 mb-2">特征贡献分析</h4>
            <ReactECharts option={shapOption} style={{ height: 140 }} />
            <p className="text-xs text-slate-400 mt-1.5">红色增加风险，绿色降低风险</p>
          </div>
        </div>
      </div>
    </div>
  )
}