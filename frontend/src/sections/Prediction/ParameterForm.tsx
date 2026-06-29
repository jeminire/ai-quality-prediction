import { useState, useEffect } from "react"
import { Activity, Gauge, RotateCcw, MoveRight, Droplets, Zap, Thermometer, ArrowRight, Fuel, Anchor, Package, AlertTriangle, CheckCircle } from "lucide-react"
import type { ProcessParams, MaterialBatchFeatures } from "@/types/prediction"
import type { MaterialBatch } from "@/types/batch"

interface ParameterFormProps {
  onPredict: (params: ProcessParams, material?: MaterialBatchFeatures) => void
  onParamChange?: (params: ProcessParams) => void
  loading?: boolean
  realtimeMode?: boolean
}

const parameters = [
  {
    key: "heating_temperature" as const,
    label: "加热温度",
    unit: "°C",
    min: 800,
    max: 900,
    step: 0.1,
    defaultValue: 850,
    icon: <Thermometer className="w-4 h-4" />,
    threshold: "845-855",
  },
  {
    key: "forming_pressure" as const,
    label: "成型压力",
    unit: "MPa",
    min: 100,
    max: 140,
    step: 0.1,
    defaultValue: 120,
    icon: <Gauge className="w-4 h-4" />,
    threshold: "117.5-122.5",
  },
  {
    key: "spindle_speed" as const,
    label: "主轴转速",
    unit: "rpm",
    min: 1000,
    max: 2000,
    step: 1,
    defaultValue: 1500,
    icon: <RotateCcw className="w-4 h-4" />,
    threshold: "1450-1550",
  },
  {
    key: "coolant_flow" as const,
    label: "冷却液流量",
    unit: "L/min",
    min: 20,
    max: 30,
    step: 0.1,
    defaultValue: 25,
    icon: <Droplets className="w-4 h-4" />,
    threshold: "23.8-26.2",
  },
  {
    key: "vibration_amplitude" as const,
    label: "振动幅度",
    unit: "mm/s",
    min: 1,
    max: 4,
    step: 0.1,
    defaultValue: 2.5,
    icon: <Activity className="w-4 h-4" />,
    threshold: "2.2-2.8",
  },
  {
    key: "current_intensity" as const,
    label: "电流强度",
    unit: "A",
    min: 40,
    max: 50,
    step: 0.1,
    defaultValue: 45,
    icon: <Zap className="w-4 h-4" />,
    threshold: "43.5-46.5",
  },
  {
    key: "mold_temperature" as const,
    label: "模具温度",
    unit: "°C",
    min: 170,
    max: 190,
    step: 0.1,
    defaultValue: 180,
    icon: <Thermometer className="w-4 h-4" />,
    threshold: "177-183",
  },
  {
    key: "feed_rate" as const,
    label: "进给速度",
    unit: "mm/min",
    min: 250,
    max: 350,
    step: 1,
    defaultValue: 300,
    icon: <MoveRight className="w-4 h-4" />,
    threshold: "290-310",
  },
  {
    key: "lubricant_flow" as const,
    label: "润滑剂流量",
    unit: "ml/min",
    min: 12,
    max: 18,
    step: 0.1,
    defaultValue: 15,
    icon: <Fuel className="w-4 h-4" />,
    threshold: "14.2-15.8",
  },
  {
    key: "clamp_force" as const,
    label: "夹紧力",
    unit: "kN",
    min: 70,
    max: 90,
    step: 0.1,
    defaultValue: 80,
    icon: <Anchor className="w-4 h-4" />,
    threshold: "78-82",
  },
]

export function ParameterForm({ onPredict, onParamChange, loading = false, realtimeMode = false }: ParameterFormProps) {
  const [values, setValues] = useState<ProcessParams>({
    heating_temperature: 850,
    forming_pressure: 120,
    spindle_speed: 1500,
    coolant_flow: 25,
    vibration_amplitude: 2.5,
    current_intensity: 45,
    mold_temperature: 180,
    feed_rate: 300,
    lubricant_flow: 15,
    clamp_force: 80,
  })

  // 物料批次状态
  const [materialBatches, setMaterialBatches] = useState<MaterialBatch[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("")
  const [loadingMaterials, setLoadingMaterials] = useState(false)

  // 获取物料批次列表
  useEffect(() => {
    const fetchMaterialBatches = async () => {
      setLoadingMaterials(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1'}/data/material_batch?per_page=100`)
        const data = await response.json()
        if (data.code === 200 && data.data.data) {
          setMaterialBatches(data.data.data)
        }
      } catch (error) {
        console.error('获取物料批次失败:', error)
      } finally {
        setLoadingMaterials(false)
      }
    }
    fetchMaterialBatches()
  }, [])

  // 获取选中的物料批次详情
  const selectedMaterial = materialBatches.find(m => m.material_batch_id === selectedMaterialId)

  // 将物料批次转换为MaterialBatchFeatures
  const getMaterialFeatures = (): MaterialBatchFeatures | undefined => {
    if (!selectedMaterial) return undefined
    return {
      material_batch_id: selectedMaterial.material_batch_id,
      supplier: selectedMaterial.supplier,
      material_type: selectedMaterial.material_type,
      carbon_content: selectedMaterial.carbon_content,
      silicon_content: selectedMaterial.silicon_content,
      manganese_content: selectedMaterial.manganese_content,
      phosphorus_content: selectedMaterial.phosphorus_content,
      sulfur_content: selectedMaterial.sulfur_content,
      raw_hardness: selectedMaterial.raw_hardness,
      tensile_strength: selectedMaterial.tensile_strength,
      material_status: selectedMaterial.material_status,
      risk_reason: selectedMaterial.risk_reason || "",
      storage_temperature: selectedMaterial.storage_temperature,
      storage_humidity: selectedMaterial.storage_humidity,
    }
  }

  const handleChange = (key: keyof ProcessParams, value: number) => {
    const newValues = { ...values, [key]: value }
    setValues(newValues)
    if (realtimeMode && onParamChange) {
      onParamChange(newValues)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const materialFeatures = getMaterialFeatures()
    onPredict(values, materialFeatures)
  }

  const handleReset = () => {
    const defaults = {
      heating_temperature: 850,
      forming_pressure: 120,
      spindle_speed: 1500,
      coolant_flow: 25,
      vibration_amplitude: 2.5,
      current_intensity: 45,
      mold_temperature: 180,
      feed_rate: 300,
      lubricant_flow: 15,
      clamp_force: 80,
    }
    setValues(defaults)
    setSelectedMaterialId("")
    if (realtimeMode && onParamChange) {
      onParamChange(defaults)
    }
  }

  const getRangeStatus = (key: keyof ProcessParams, value: number) => {
    const param = parameters.find((p) => p.key === key)
    if (!param) return "normal"
    const [min, max] = param.threshold.split("-").map(Number)
    if (value < min || value > max) return "warning"
    return "normal"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 物料批次选择 */}
      <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-700">物料批次选择</h3>
          <span className="text-xs text-slate-400">(可选，用于考虑原材料对质量的影响)</span>
        </div>
        <select
          value={selectedMaterialId}
          onChange={(e) => setSelectedMaterialId(e.target.value)}
          disabled={loadingMaterials}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="">-- 不选择物料批次（仅使用工艺参数预测）--</option>
          {materialBatches.map((batch) => (
            <option key={batch.material_batch_id} value={batch.material_batch_id}>
              {batch.material_batch_id} - {batch.material_type} - {batch.supplier} ({batch.material_status === "NORMAL" ? "正常" : "风险"})
            </option>
          ))}
        </select>

        {/* 选中物料批次详情 */}
        {selectedMaterial && (
          <div className="mt-3 p-3 rounded-lg bg-white/80 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              {selectedMaterial.material_status === "NORMAL" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              <span className={`text-xs font-medium ${selectedMaterial.material_status === "NORMAL" ? "text-green-600" : "text-amber-600"}`}>
                {selectedMaterial.material_status === "NORMAL" ? "物料状态正常" : `风险物料 - ${selectedMaterial.risk_reason}`}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">物料类型:</span>
                <span className="ml-1 font-medium">{selectedMaterial.material_type}</span>
              </div>
              <div>
                <span className="text-slate-400">供应商:</span>
                <span className="ml-1 font-medium">{selectedMaterial.supplier}</span>
              </div>
              <div>
                <span className="text-slate-400">碳含量:</span>
                <span className="ml-1 font-medium">{selectedMaterial.carbon_content}%</span>
              </div>
              <div>
                <span className="text-slate-400">硅含量:</span>
                <span className="ml-1 font-medium">{selectedMaterial.silicon_content}%</span>
              </div>
              <div>
                <span className="text-slate-400">锰含量:</span>
                <span className="ml-1 font-medium">{selectedMaterial.manganese_content}%</span>
              </div>
              <div>
                <span className="text-slate-400">磷含量:</span>
                <span className="ml-1 font-medium">{selectedMaterial.phosphorus_content}%</span>
              </div>
              <div>
                <span className="text-slate-400">硫含量:</span>
                <span className="ml-1 font-medium">{selectedMaterial.sulfur_content}%</span>
              </div>
              <div>
                <span className="text-slate-400">原材料硬度:</span>
                <span className="ml-1 font-medium">{selectedMaterial.raw_hardness}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parameters.map((param) => {
          const status = getRangeStatus(param.key, values[param.key])
          return (
            <div key={param.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="text-slate-400">{param.icon}</span>
                  {param.label}
                </label>
                <span className="text-xs text-slate-400">
                  阈值: {param.threshold} {param.unit}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={values[param.key]}
                  onChange={(e) => handleChange(param.key, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
                <div className="flex items-center gap-1.5 min-w-[110px]">
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={values[param.key]}
                    onChange={(e) => handleChange(param.key, parseFloat(e.target.value) || 0)}
                    className={`w-20 px-2 py-2 text-right text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      status === "warning"
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap w-10">
                    {param.unit}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              预测中...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              开始预测
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置参数
        </button>
      </div>
    </form>
  )
}
