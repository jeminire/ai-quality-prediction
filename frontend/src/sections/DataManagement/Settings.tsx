import { useState } from "react"
import { Save, RotateCcw, Info, AlertTriangle } from "lucide-react"

interface ThresholdItem {
  key: string
  label: string
  unit: string
  min: number
  max: number
  normalMin: number
  normalMax: number
}

const DEFAULT_THRESHOLDS: ThresholdItem[] = [
  { key: "heating_temperature", label: "加热温度", unit: "°C", min: 800, max: 900, normalMin: 845, normalMax: 855 },
  { key: "forming_pressure", label: "成型压力", unit: "MPa", min: 100, max: 150, normalMin: 117.5, normalMax: 122.5 },
  { key: "spindle_speed", label: "主轴转速", unit: "rpm", min: 1200, max: 1800, normalMin: 1450, normalMax: 1550 },
  { key: "coolant_flow", label: "冷却液流量", unit: "L/min", min: 18, max: 32, normalMin: 23.8, normalMax: 26.2 },
  { key: "vibration_amplitude", label: "振动幅度", unit: "mm/s", min: 1, max: 5, normalMin: 2.2, normalMax: 2.8 },
  { key: "current_intensity", label: "电流强度", unit: "A", min: 38, max: 52, normalMin: 43.5, normalMax: 46.5 },
  { key: "mold_temperature", label: "模具温度", unit: "°C", min: 160, max: 200, normalMin: 177, normalMax: 183 },
  { key: "feed_rate", label: "进给速度", unit: "mm/min", min: 220, max: 380, normalMin: 290, normalMax: 310 },
]

const QUALITY_THRESHOLDS = [
  { key: "hardness_min", label: "硬度下限", unit: "HB", value: 195 },
  { key: "hardness_max", label: "硬度上限", unit: "HB", value: 220 },
  { key: "thickness_tolerance", label: "厚度公差", unit: "mm", value: 0.1 },
  { key: "parallelism_max", label: "平行度上限", unit: "mm", value: 0.03 },
  { key: "roughness_max", label: "表面粗糙度上限", unit: "μm", value: 1.2 },
]

export function Settings() {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [qualityThresholds, setQualityThresholds] = useState(QUALITY_THRESHOLDS)
  const [saved, setSaved] = useState(false)
  const [apiUrl, setApiUrl] = useState("http://localhost:5000/api/v1")
  const [pollInterval, setPollInterval] = useState(30)
  const [alertEnabled, setAlertEnabled] = useState(true)

  const updateThreshold = (key: string, field: "normalMin" | "normalMax", value: number) => {
    setThresholds((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    )
    setSaved(false)
  }

  const updateQualityThreshold = (key: string, value: number) => {
    setQualityThresholds((prev) =>
      prev.map((t) => (t.key === key ? { ...t, value } : t))
    )
    setSaved(false)
  }

  const handleSave = () => {
    // 保存到 localStorage
    localStorage.setItem("ai-quality-thresholds", JSON.stringify(thresholds))
    localStorage.setItem("ai-quality-quality-thresholds", JSON.stringify(qualityThresholds))
    localStorage.setItem("ai-quality-api-url", apiUrl)
    localStorage.setItem("ai-quality-poll-interval", String(pollInterval))
    localStorage.setItem("ai-quality-alert-enabled", String(alertEnabled))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS)
    setQualityThresholds(QUALITY_THRESHOLDS)
    setApiUrl("http://localhost:5000/api/v1")
    setPollInterval(30)
    setAlertEnabled(true)
    setSaved(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* 系统信息 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          系统信息
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: "数据集", value: "quality_label.csv (100条) + process_data.csv (5000条)" },
            { label: "设备数量", value: "4台（EQ-A01/A02/B01/B02）" },
            { label: "材料类型", value: "HT250 / HT300 / QT450 / QT500" },
            { label: "供应商", value: "A / B / C (三家)" },
            { label: "监测区域", value: "Zone-A / Zone-B / Zone-C" },
            { label: "合格率基准", value: "92% (2024年3月数据)" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-blue-600 font-medium">{label}</span>
              <span className="text-blue-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API 配置 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">服务连接配置</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">后端 API 地址</label>
            <input
              value={apiUrl}
              onChange={(e) => { setApiUrl(e.target.value); setSaved(false) }}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">数据刷新间隔（秒）</label>
            <input
              type="number" min={5} max={300}
              value={pollInterval}
              onChange={(e) => { setPollInterval(Number(e.target.value)); setSaved(false) }}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">实时告警通知</p>
              <p className="text-xs text-slate-400">质量异常时触发告警</p>
            </div>
            <button
              onClick={() => { setAlertEnabled(!alertEnabled); setSaved(false) }}
              className={`relative h-6 w-11 rounded-full transition-colors ${alertEnabled ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${alertEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 工艺参数阈值 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          工艺参数正常范围阈值
        </h3>
        <p className="text-xs text-slate-400 mb-4">超出此范围将触发预警。数据来源：process_data.csv</p>
        <div className="space-y-3">
          {thresholds.map((t) => (
            <div key={t.key} className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <p className="text-sm text-slate-700">{t.label}</p>
                <p className="text-xs text-slate-400">{t.unit}</p>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-slate-400">最小</span>
                <input
                  type="number" step="0.1"
                  value={t.normalMin}
                  onChange={(e) => updateThreshold(t.key, "normalMin", parseFloat(e.target.value))}
                  className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-500 text-center"
                />
                <span className="text-xs text-slate-300">—</span>
                <input
                  type="number" step="0.1"
                  value={t.normalMax}
                  onChange={(e) => updateThreshold(t.key, "normalMax", parseFloat(e.target.value))}
                  className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-500 text-center"
                />
                <span className="text-xs text-slate-400">最大</span>
                <div className="ml-2 flex-1 h-1.5 rounded-full bg-slate-100 relative">
                  <div
                    className="absolute h-full rounded-full bg-blue-400"
                    style={{
                      left: `${((t.normalMin - t.min) / (t.max - t.min)) * 100}%`,
                      right: `${((t.max - t.normalMax) / (t.max - t.min)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 质量检验阈值 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">质量检验判定阈值</h3>
        <p className="text-xs text-slate-400 mb-4">检测结果超出此阈值判定为不合格。数据来源：quality_label.csv</p>
        <div className="grid grid-cols-2 gap-4">
          {qualityThresholds.map((t) => (
            <div key={t.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                {t.label}（{t.unit}）
              </label>
              <input
                type="number" step="0.01"
                value={t.value}
                onChange={(e) => updateQualityThreshold(t.key, parseFloat(e.target.value))}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          重置为默认值
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
            saved
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Save className="h-4 w-4" />
          {saved ? "✓ 已保存" : "保存配置"}
        </button>
      </div>
    </div>
  )
}
