import { useState, useEffect } from "react"
import { X, AlertTriangle, CheckCircle2, BarChart3, Loader2 } from "lucide-react"
import ReactECharts from "echarts-for-react"
import type { QualityBatch } from "../../types/batch"

interface BatchDetailProps {
  batch: QualityBatch | null
  onClose: () => void
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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

export function BatchDetail({ batch, onClose }: BatchDetailProps) {
  const [shapData, setShapData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    fetch(`${BASE_URL}/shap/explanation/${batch.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 200 && json.data?.explanation?.feature_contributions) {
          setShapData(json.data.explanation.feature_contributions)
        } else {
          // 使用模拟数据
          setShapData([
            { feature: "forming_pressure", contribution: 0.25, value: 120.3 },
            { feature: "heating_temperature", contribution: 0.15, value: 850.5 },
            { feature: "coolant_flow", contribution: -0.1, value: 25.2 },
            { feature: "vibration_amplitude", contribution: 0.08, value: 2.5 },
            { feature: "spindle_speed", contribution: -0.05, value: 1500 },
          ])
        }
      })
      .catch(() => {
        setShapData([
          { feature: "forming_pressure", contribution: 0.25, value: 120.3 },
          { feature: "heating_temperature", contribution: 0.15, value: 850.5 },
          { feature: "coolant_flow", contribution: -0.1, value: 25.2 },
          { feature: "vibration_amplitude", contribution: 0.08, value: 2.5 },
          { feature: "spindle_speed", contribution: -0.05, value: 1500 },
        ])
      })
      .finally(() => setLoading(false))
  }, [batch])

  if (!batch) return null

  const shapOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const p = params[0]
        const val = p.value
        const color = val > 0 ? "#ef4444" : "#22c55e"
        return `${p.name}<br/>贡献值: <span style="color:${color}">${val > 0 ? "+" : ""}${val.toFixed(3)}</span>`
      },
    },
    grid: { left: 100, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => v.toFixed(2) },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },
    yAxis: {
      type: "category",
      data: [...shapData].reverse().map((d) => featureLabels[d.feature] || d.feature),
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        type: "bar",
        data: [...shapData].reverse().map((d) => ({
          value: d.contribution,
          itemStyle: {
            color: d.contribution > 0 ? "#ef4444" : "#22c55e",
            borderRadius: 4,
          },
        })),
        barMaxWidth: 24,
        label: {
          show: true,
          position: "right",
          formatter: (p: any) => `${p.value > 0 ? "+" : ""}${p.value.toFixed(3)}`,
          fontSize: 11,
        },
      },
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800">批次详情</h3>
            <span className="font-mono text-xs text-blue-600">{batch.batch_id}</span>
            {batch.quality_status === 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                合格
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                不合格
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">材料批次</p>
              <p className="font-mono text-sm font-medium">{batch.material_batch_id}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">检验员</p>
              <p className="text-sm font-medium">{batch.inspector}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">检验时间</p>
              <p className="text-sm">{batch.inspection_time?.slice(0, 16).replace("T", " ")}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">缺陷类型</p>
              <p className="text-sm">{batch.defect_type || "无缺陷"}</p>
            </div>
          </div>

          {/* 检测数据 */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">检测数据</h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "厚度", value: batch.thickness, unit: "mm" },
                { label: "平行度", value: batch.parallelism, unit: "mm" },
                { label: "硬度", value: batch.hardness, unit: "HB" },
                { label: "表面粗糙度", value: batch.surface_roughness, unit: "μm" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-lg font-bold text-slate-800">
                    {Number(item.value).toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP 分析 */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              AI 特征贡献分析 (SHAP)
            </h4>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>加载中...</span>
              </div>
            ) : (
              <ReactECharts option={shapOption} style={{ height: 200 }} />
            )}
            <p className="text-xs text-slate-400 mt-2">
              红色表示增加风险，绿色表示降低风险
            </p>
          </div>

          {/* 根因 */}
          {batch.root_cause && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">根因分析</p>
              <p className="text-sm text-amber-700">{batch.root_cause}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}