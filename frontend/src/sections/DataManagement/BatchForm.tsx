import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import type { QualityBatch } from "../../types/batch"

interface BatchFormProps {
  open: boolean
  initialData?: QualityBatch | null
  onClose: () => void
  onSaved: () => void
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

// 工艺参数默认值（使用正常范围中值）
const defaultFeatures = {
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
  hardness: 207,
  thickness: 25.0,
  parallelism: 0.02,
  surface_roughness: 0.9,
}

const DEFECT_TYPES = ["无缺陷", "尺寸超差", "材料成分异常", "硬度不达标", "表面超差"]
const INSPECTORS = ["INS-001", "INS-002", "INS-003"]
const ROOT_CAUSES = [
  { value: "none", label: "无" },
  { value: "other", label: "其他" },
  { value: "material_silicon", label: "硅含量异常" },
  { value: "process_pressure", label: "工艺压力异常" },
  { value: "equipment_vibration", label: "设备振动超标" },
]

type FormData = typeof defaultFeatures & {
  batch_id: string
  material_batch_id: string
  quality_status: 0 | 1
  defect_type: string
  root_cause: string
  inspection_time: string
  inspector: string
}

export function BatchForm({ open, initialData, onClose, onSaved }: BatchFormProps) {
  const isEdit = !!initialData

  const [form, setForm] = useState<FormData>({
    batch_id: "",
    material_batch_id: "",
    quality_status: 0,
    defect_type: "无缺陷",
    root_cause: "none",
    inspection_time: new Date().toISOString().slice(0, 16),
    inspector: "INS-001",
    ...defaultFeatures,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setForm({
        batch_id: initialData.batch_id,
        material_batch_id: initialData.material_batch_id,
        quality_status: initialData.quality_status,
        defect_type: initialData.defect_type,
        root_cause: initialData.root_cause,
        inspection_time: initialData.inspection_time?.slice(0, 16),
        inspector: initialData.inspector,
        ...defaultFeatures,
        hardness: initialData.hardness,
        thickness: initialData.thickness,
        parallelism: initialData.parallelism,
        surface_roughness: initialData.surface_roughness,
      })
    } else {
      setForm({
        batch_id: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
        material_batch_id: `MBATCH-${String(Math.floor(Math.random() * 200) + 1).padStart(4, "0")}`,
        quality_status: 0,
        defect_type: "无缺陷",
        root_cause: "none",
        inspection_time: new Date().toISOString().slice(0, 16),
        inspector: "INS-001",
        ...defaultFeatures,
      })
    }
    setErrors({})
  }, [initialData, open])

  const setField = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.batch_id.trim()) errs.batch_id = "批次号不能为空"
    if (!form.material_batch_id.trim()) errs.material_batch_id = "材料批次不能为空"
    if (isNaN(form.hardness) || form.hardness <= 0) errs.hardness = "请输入有效硬度值"
    if (isNaN(form.thickness) || form.thickness <= 0) errs.thickness = "请输入有效厚度值"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        features: {
          heating_temperature: form.heating_temperature,
          forming_pressure: form.forming_pressure,
          spindle_speed: form.spindle_speed,
          coolant_flow: form.coolant_flow,
          vibration_amplitude: form.vibration_amplitude,
          current_intensity: form.current_intensity,
          mold_temperature: form.mold_temperature,
          feed_rate: form.feed_rate,
          lubricant_flow: form.lubricant_flow,
          clamp_force: form.clamp_force,
          hardness: form.hardness,
          thickness: form.thickness,
          parallelism: form.parallelism,
          surface_roughness: form.surface_roughness,
        },
        label: form.quality_status,
      }
      const url = isEdit
        ? `${BASE_URL}/data/${initialData!.id}`
        : `${BASE_URL}/data/`
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.code === 200) {
        onSaved()
        onClose()
      } else {
        setErrors({ _global: json.message || "保存失败" })
      }
    } catch {
      setErrors({ _global: "网络错误，请重试" })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? "编辑批次记录" : "新增批次记录"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {errors._global && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {errors._global}
            </div>
          )}

          {/* 批次信息 */}
          <section>
            <h3 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">批次基础信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="批次编号 *" error={errors.batch_id}>
                <input
                  value={form.batch_id}
                  onChange={(e) => setField("batch_id", e.target.value)}
                  className={inputCls(errors.batch_id)}
                  placeholder="BATCH-20240601-001"
                />
              </FormField>
              <FormField label="材料批次 *" error={errors.material_batch_id}>
                <input
                  value={form.material_batch_id}
                  onChange={(e) => setField("material_batch_id", e.target.value)}
                  className={inputCls(errors.material_batch_id)}
                  placeholder="MBATCH-0001"
                />
              </FormField>
              <FormField label="质量状态">
                <select
                  value={form.quality_status}
                  onChange={(e) => setField("quality_status", Number(e.target.value) as 0 | 1)}
                  className={inputCls()}
                >
                  <option value={0}>合格</option>
                  <option value={1}>不合格</option>
                </select>
              </FormField>
              <FormField label="缺陷类型">
                <select
                  value={form.defect_type}
                  onChange={(e) => setField("defect_type", e.target.value)}
                  className={inputCls()}
                >
                  {DEFECT_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="根因">
                <select
                  value={form.root_cause}
                  onChange={(e) => setField("root_cause", e.target.value)}
                  className={inputCls()}
                >
                  {ROOT_CAUSES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="检验员">
                <select
                  value={form.inspector}
                  onChange={(e) => setField("inspector", e.target.value)}
                  className={inputCls()}
                >
                  {INSPECTORS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="检验时间">
                <input
                  type="datetime-local"
                  value={form.inspection_time}
                  onChange={(e) => setField("inspection_time", e.target.value)}
                  className={inputCls()}
                />
              </FormField>
            </div>
          </section>

          {/* 检测结果 */}
          <section>
            <h3 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">检测尺寸数据</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="厚度 (mm)" error={errors.thickness}>
                <input
                  type="number" step="0.001"
                  value={form.thickness}
                  onChange={(e) => setField("thickness", parseFloat(e.target.value))}
                  className={inputCls(errors.thickness)}
                />
              </FormField>
              <FormField label="平行度 (mm)" error={errors.parallelism}>
                <input
                  type="number" step="0.0001"
                  value={form.parallelism}
                  onChange={(e) => setField("parallelism", parseFloat(e.target.value))}
                  className={inputCls(errors.parallelism)}
                />
              </FormField>
              <FormField label="硬度 (HB)" error={errors.hardness}>
                <input
                  type="number" step="0.1"
                  value={form.hardness}
                  onChange={(e) => setField("hardness", parseFloat(e.target.value))}
                  className={inputCls(errors.hardness)}
                />
              </FormField>
              <FormField label="表面粗糙度 (μm)">
                <input
                  type="number" step="0.01"
                  value={form.surface_roughness}
                  onChange={(e) => setField("surface_roughness", parseFloat(e.target.value))}
                  className={inputCls()}
                />
              </FormField>
            </div>
          </section>

          {/* 工艺参数 */}
          <section>
            <h3 className="mb-3 text-sm font-medium text-slate-500 uppercase tracking-wide">关键工艺参数</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "heating_temperature", label: "加热温度 (°C)", step: 0.1 },
                { key: "forming_pressure", label: "成型压力 (MPa)", step: 0.1 },
                { key: "spindle_speed", label: "主轴转速 (rpm)", step: 1 },
                { key: "coolant_flow", label: "冷却液流量 (L/min)", step: 0.1 },
                { key: "vibration_amplitude", label: "振动幅度 (mm/s)", step: 0.01 },
                { key: "current_intensity", label: "电流强度 (A)", step: 0.1 },
                { key: "mold_temperature", label: "模具温度 (°C)", step: 0.1 },
                { key: "feed_rate", label: "进给速度 (mm/min)", step: 1 },
                { key: "lubricant_flow", label: "润滑剂流量 (ml/min)", step: 0.1 },
                { key: "clamp_force", label: "夹紧力 (kN)", step: 0.1 },
              ].map(({ key, label, step }) => (
                <FormField key={key} label={label}>
                  <input
                    type="number" step={step}
                    value={form[key as keyof FormData] as number}
                    onChange={(e) => setField(key as keyof FormData, parseFloat(e.target.value))}
                    className={inputCls()}
                  />
                </FormField>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />保存中...</>
            ) : (
              <><Save className="h-4 w-4" />{isEdit ? "更新" : "创建"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 辅助组件
function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

function inputCls(error?: string) {
  return `h-9 w-full rounded-lg border ${error ? "border-red-400 bg-red-50" : "border-slate-200"} px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200`
}
