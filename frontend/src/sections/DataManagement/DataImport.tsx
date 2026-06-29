import { useState } from "react"
import { Upload, Database, CheckCircle2, XCircle, Loader2, BarChart3, Thermometer, Package, Cpu, Zap, RefreshCw } from "lucide-react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type ImportStatus = "idle" | "loading" | "success" | "error"

interface ImportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  status: ImportStatus
  count?: number
  errorMsg?: string
  onImport: () => void
  detail: string[]
  color?: string
}

function ImportCard({ title, description, icon, status, count, errorMsg, onImport, detail, color = "bg-slate-100 text-slate-600" }: ImportCardProps) {
  const statusColors = {
    idle: "border-slate-200 bg-white",
    loading: "border-blue-300 bg-blue-50",
    success: "border-green-300 bg-green-50",
    error: "border-red-300 bg-red-50",
  }

  return (
    <div className={`rounded-xl border-2 p-5 transition-all ${statusColors[status]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2.5 ${status === "success" ? "bg-green-100 text-green-600" : color}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "success" && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已导入 {count} 条
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              导入失败
            </span>
          )}
          <button
            onClick={onImport}
            disabled={status === "loading" || status === "success"}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === "success"
                ? "bg-green-100 text-green-600 cursor-default"
                : status === "loading"
                ? "bg-blue-100 text-blue-600 cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-60`}
          >
            {status === "loading" ? (
              <><Loader2 className="h-4 w-4 animate-spin" />导入中...</>
            ) : status === "success" ? (
              <><CheckCircle2 className="h-4 w-4" />已完成</>
            ) : (
              <><Upload className="h-4 w-4" />导入数据</>
            )}
          </button>
        </div>
      </div>

      {/* 字段预览 */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {detail.map((f) => (
          <span key={f} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
            {f}
          </span>
        ))}
      </div>

      {errorMsg && (
        <div className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  )
}

interface DataImportProps {
  onImportDone?: () => void
}

export function DataImport({ onImportDone }: DataImportProps) {
  const [processStatus, setProcessStatus] = useState<ImportStatus>("idle")
  const [processCount, setProcessCount] = useState<number>()
  const [processError, setProcessError] = useState<string>()

  const [qualityStatus, setQualityStatus] = useState<ImportStatus>("idle")
  const [qualityCount, setQualityCount] = useState<number>()
  const [qualityError, setQualityError] = useState<string>()

  const [materialStatus, setMaterialStatus] = useState<ImportStatus>("idle")
  const [materialCount, setMaterialCount] = useState<number>()
  const [materialError, setMaterialError] = useState<string>()

  const [equipmentStatus, setEquipmentStatus] = useState<ImportStatus>("idle")
  const [equipmentCount, setEquipmentCount] = useState<number>()
  const [equipmentError, setEquipmentError] = useState<string>()

  const [environmentStatus, setEnvironmentStatus] = useState<ImportStatus>("idle")
  const [environmentCount, setEnvironmentCount] = useState<number>()
  const [environmentError, setEnvironmentError] = useState<string>()

  const [allImporting, setAllImporting] = useState(false)

  const [modelStatus, setModelStatus] = useState<ImportStatus>("idle")
  const [modelError, setModelError] = useState<string>()

  const importData = async (endpoint: string, setStatus: React.Dispatch<React.SetStateAction<ImportStatus>>, setCount: React.Dispatch<React.SetStateAction<number | undefined>>, setError: React.Dispatch<React.SetStateAction<string | undefined>>, defaultCount: number) => {
    setStatus("loading")
    setError(undefined)
    try {
      const res = await fetch(`${BASE_URL}/data/import/${endpoint}`, { method: "POST" })
      const json = await res.json()
      if (json.code === 200) {
        setCount(json.data?.imported_count ?? json.data?.count ?? defaultCount)
        setStatus("success")
        onImportDone?.()
      } else {
        setError(json.message || "导入失败")
        setStatus("error")
      }
    } catch {
      setError("无法连接后端服务，请确认 Flask 已启动（localhost:5000）")
      setStatus("error")
    }
  }

  const importProcess = async () => {
    await importData("process", setProcessStatus, setProcessCount, setProcessError, 5000)
  }

  const importQuality = async () => {
    await importData("quality", setQualityStatus, setQualityCount, setQualityError, 100)
  }

  const importMaterial = async () => {
    await importData("material", setMaterialStatus, setMaterialCount, setMaterialError, 200)
  }

  const importEquipment = async () => {
    await importData("equipment", setEquipmentStatus, setEquipmentCount, setEquipmentError, 1000)
  }

  const importEnvironment = async () => {
    await importData("environment", setEnvironmentStatus, setEnvironmentCount, setEnvironmentError, 2000)
  }

  const importAll = async () => {
    setAllImporting(true)
    try {
      const res = await fetch(`${BASE_URL}/data/import/all`, { method: "POST" })
      const json = await res.json()
      if (json.code === 200) {
        setProcessCount(json.data?.process?.imported_count ?? 5000)
        setProcessStatus("success")
        setQualityCount(json.data?.quality?.updated_count ?? 100)
        setQualityStatus("success")
        setMaterialCount(json.data?.material?.imported_count ?? 200)
        setMaterialStatus("success")
        setEquipmentCount(json.data?.equipment?.imported_count ?? 1000)
        setEquipmentStatus("success")
        setEnvironmentCount(json.data?.environment?.imported_count ?? 2000)
        setEnvironmentStatus("success")
        onImportDone?.()
      } else {
        alert(json.message || "导入失败")
      }
    } catch {
      alert("无法连接后端服务，请确认 Flask 已启动（localhost:5000）")
    } finally {
      setAllImporting(false)
    }
  }

  const resetAll = () => {
    setProcessStatus("idle")
    setProcessCount(undefined)
    setProcessError(undefined)
    setQualityStatus("idle")
    setQualityCount(undefined)
    setQualityError(undefined)
    setMaterialStatus("idle")
    setMaterialCount(undefined)
    setMaterialError(undefined)
    setEquipmentStatus("idle")
    setEquipmentCount(undefined)
    setEquipmentError(undefined)
    setEnvironmentStatus("idle")
    setEnvironmentCount(undefined)
    setEnvironmentError(undefined)
    setModelStatus("idle")
    setModelError(undefined)
  }

  const trainModel = async () => {
    setModelStatus("loading")
    setModelError(undefined)
    try {
      const checkRes = await fetch(`${BASE_URL}/models/latest`)
      const checkJson = await checkRes.json()
      if (checkJson.data) {
        setModelStatus("success")
        return
      }
      const res = await fetch(`${BASE_URL}/models/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "quality_model", version: "1.0.0" }),
      })
      const json = await res.json()
      if (json.code === 200) {
        setModelStatus("success")
      } else {
        setModelError(json.message || "训练失败")
        setModelStatus("error")
      }
    } catch {
      setModelError("无法连接后端服务")
      setModelStatus("error")
    }
  }

  const allDataImported = 
    processStatus === "success" && 
    qualityStatus === "success" && 
    materialStatus === "success" && 
    equipmentStatus === "success" && 
    environmentStatus === "success"

  return (
    <div className="space-y-6">
      {/* 说明栏 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">数据初始化说明</h3>
            <p className="text-sm text-blue-700">
              首次使用请导入数据。您可以选择一键导入所有数据，或分别导入各数据集。
              数据来源于五个预置 CSV 文件，由后端自动读取。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={importAll}
              disabled={allImporting || allDataImported}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                allImporting
                  ? "bg-blue-100 text-blue-600 cursor-wait"
                  : allDataImported
                  ? "bg-green-100 text-green-600 cursor-default"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
              } disabled:opacity-60`}
            >
              {allImporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />全部导入中...</>
              ) : allDataImported ? (
                <><CheckCircle2 className="h-4 w-4" />全部已导入</>
              ) : (
                <><Zap className="h-4 w-4" />一键导入全部</>
              )}
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />重置状态
            </button>
          </div>
        </div>
      </div>

      {/* 核心数据导入卡片 */}
      <div className="space-y-4">
        <ImportCard
          title="工艺参数数据"
          description="process_data.csv · 5,000 条生产工艺记录"
          icon={<BarChart3 className="h-5 w-5" />}
          status={processStatus}
          count={processCount}
          errorMsg={processError}
          onImport={importProcess}
          detail={["batch_id", "heating_temperature", "forming_pressure", "spindle_speed", "coolant_flow", "vibration_amplitude", "current_intensity", "mold_temperature", "feed_rate", "lubricant_flow", "clamp_force"]}
          color="bg-blue-100 text-blue-600"
        />

        <ImportCard
          title="质量标签数据"
          description="quality_label.csv · 100 条质量检验记录"
          icon={<Database className="h-5 w-5" />}
          status={qualityStatus}
          count={qualityCount}
          errorMsg={qualityError}
          onImport={importQuality}
          detail={["batch_id", "quality_status", "defect_type", "root_cause", "thickness", "parallelism", "hardness", "surface_roughness", "inspector"]}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* 附加数据导入卡片 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
          <Package className="h-4 w-4" />
          附加数据集
        </h3>
        <div className="space-y-4">
          <ImportCard
            title="物料批次数据"
            description="material_data.csv · 200 条物料批次记录"
            icon={<Package className="h-5 w-5" />}
            status={materialStatus}
            count={materialCount}
            errorMsg={materialError}
            onImport={importMaterial}
            detail={["material_batch_id", "supplier", "material_type", "carbon_content", "raw_hardness", "tensile_strength"]}
            color="bg-emerald-100 text-emerald-600"
          />

          <ImportCard
            title="设备状态数据"
            description="equipment_data.csv · 1,000 条设备状态记录"
            icon={<Cpu className="h-5 w-5" />}
            status={equipmentStatus}
            count={equipmentCount}
            errorMsg={equipmentError}
            onImport={importEquipment}
            detail={["equipment_id", "status", "temperature", "vibration", "power_consumption", "spindle_load"]}
            color="bg-violet-100 text-violet-600"
          />

          <ImportCard
            title="环境参数数据"
            description="environment_data.csv · 2,000 条环境监测记录"
            icon={<Thermometer className="h-5 w-5" />}
            status={environmentStatus}
            count={environmentCount}
            errorMsg={environmentError}
            onImport={importEnvironment}
            detail={["zone_id", "temperature", "humidity", "air_pressure", "dust_concentration", "noise_level"]}
            color="bg-cyan-100 text-cyan-600"
          />
        </div>
      </div>

      {/* 训练模型按钮（在所有数据都导入后显示） */}
      {allDataImported && (
        <div className={`rounded-xl border-2 p-5 transition-all ${
          modelStatus === "success" ? "border-green-300 bg-green-50" : "border-dashed border-blue-300 bg-blue-50"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">训练 AI 预测模型</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                所有数据就绪，点击开始训练基于 XGBoost 的质量预测模型
              </p>
              {modelError && (
                <p className="text-xs text-red-600 mt-1">⚠️ {modelError}</p>
              )}
            </div>
            <button
              onClick={trainModel}
              disabled={modelStatus === "loading" || modelStatus === "success"}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                modelStatus === "success"
                  ? "bg-green-100 text-green-700"
                  : modelStatus === "loading"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
              } disabled:opacity-60`}
            >
              {modelStatus === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" />训练中...</>
              ) : modelStatus === "success" ? (
                <><CheckCircle2 className="h-4 w-4" />训练完成</>
              ) : (
                "🚀 开始训练"
              )}
            </button>
          </div>
        </div>
      )}

      {/* 导入进度统计 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">导入进度</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            <div className={`h-2 flex-1 rounded-full transition-colors ${processStatus === "success" ? "bg-green-500" : processStatus === "loading" ? "bg-blue-400" : "bg-slate-200"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${qualityStatus === "success" ? "bg-green-500" : qualityStatus === "loading" ? "bg-blue-400" : "bg-slate-200"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${materialStatus === "success" ? "bg-green-500" : materialStatus === "loading" ? "bg-blue-400" : "bg-slate-200"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${equipmentStatus === "success" ? "bg-green-500" : equipmentStatus === "loading" ? "bg-blue-400" : "bg-slate-200"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${environmentStatus === "success" ? "bg-green-500" : environmentStatus === "loading" ? "bg-blue-400" : "bg-slate-200"}`} />
          </div>
          <span className="text-xs text-slate-500">
            {[processStatus, qualityStatus, materialStatus, equipmentStatus, environmentStatus].filter(s => s === "success").length}/5
          </span>
        </div>
      </div>
    </div>
  )
}