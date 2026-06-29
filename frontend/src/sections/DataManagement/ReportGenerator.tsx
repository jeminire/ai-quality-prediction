import { useState, useEffect, useRef } from "react"
import { FileText, Download, RefreshCw, Loader2, Printer } from "lucide-react"
import ReactECharts from "echarts-for-react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

interface FeatureImportance {
  feature: string
  importance: number
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

const STATIC_QUALITY_STATS = {
  total: 100,
  pass: 92,
  fail: 8,
  passRate: 92.0,
  defects: [
    { type: "尺寸超差", count: 2, color: "#ef4444" },
    { type: "材料成分异常", count: 2, color: "#f97316" },
    { type: "硬度不达标", count: 2, color: "#eab308" },
    { type: "表面超差", count: 2, color: "#8b5cf6" },
  ],
}

export function ReportGenerator() {
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const reportRef = useRef<HTMLDivElement>(null)

  const fetchFeatureImportance = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/shap/feature_importance`)
      const json = await res.json()
      if (json.code === 200 && json.data?.length) {
        setFeatureImportance(json.data)
        setLastUpdate(new Date().toLocaleString("zh-CN"))
      } else {
        setFeatureImportance([
          { feature: "forming_pressure", importance: 0.35 },
          { feature: "heating_temperature", importance: 0.28 },
          { feature: "coolant_flow", importance: 0.18 },
          { feature: "vibration_amplitude", importance: 0.12 },
          { feature: "spindle_speed", importance: 0.07 },
        ])
        setLastUpdate(new Date().toLocaleString("zh-CN") + " (示例数据)")
      }
    } catch {
      setFeatureImportance([
        { feature: "forming_pressure", importance: 0.35 },
        { feature: "heating_temperature", importance: 0.28 },
        { feature: "coolant_flow", importance: 0.18 },
        { feature: "vibration_amplitude", importance: 0.12 },
        { feature: "spindle_speed", importance: 0.07 },
      ])
      setLastUpdate("(离线示例数据)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeatureImportance() }, [])

  const qualityPieOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c}条 ({d}%)" },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        data: [
          { value: STATIC_QUALITY_STATS.pass, name: "合格", itemStyle: { color: "#22c55e" } },
          { value: STATIC_QUALITY_STATS.fail, name: "不合格", itemStyle: { color: "#ef4444" } },
        ],
        label: { show: true, formatter: "{b}\n{d}%", fontSize: 12 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" } },
      },
    ],
  }

  const defectBarOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 80, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    yAxis: {
      type: "category",
      data: STATIC_QUALITY_STATS.defects.map((d) => d.type),
      axisLabel: { fontSize: 12, color: "#475569" },
    },
    series: [
      {
        type: "bar",
        data: STATIC_QUALITY_STATS.defects.map((d) => ({
          value: d.count,
          itemStyle: { color: d.color, borderRadius: 4 },
        })),
        barMaxWidth: 28,
        label: { show: true, position: "right", fontSize: 12, color: "#64748b" },
      },
    ],
  }

  const featureBarOption = featureImportance.length
    ? {
        tooltip: { trigger: "axis", formatter: (p: any[]) => `${p[0].name}: ${(p[0].value * 100).toFixed(1)}%` },
        grid: { left: 90, right: 20, top: 15, bottom: 30 },
        xAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%`, fontSize: 11 },
          splitLine: { lineStyle: { color: "#f1f5f9" } },
        },
        yAxis: {
          type: "category",
          data: [...featureImportance].reverse().map((f) => featureLabels[f.feature] || f.feature),
          axisLabel: { fontSize: 12, color: "#475569" },
        },
        series: [
          {
            type: "bar",
            data: [...featureImportance].reverse().map((f, i) => ({
              value: f.importance,
              itemStyle: {
                color: ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"][i % 5],
                borderRadius: 4,
              },
            })),
            barMaxWidth: 24,
            label: {
              show: true,
              position: "right",
              formatter: (p: any) => `${(p.value * 100).toFixed(1)}%`,
              fontSize: 11,
              color: "#64748b",
            },
          },
        ],
      }
    : null

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const reportContent = reportRef.current?.innerHTML || ""
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI质量预测系统 - 质量分析报告</title>
        <style>
          body { font-family: "Microsoft YaHei", sans-serif; padding: 40px; color: #334155; }
          h1 { text-align: center; color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
          h2 { color: #475569; margin-top: 30px; border-left: 4px solid #3b82f6; padding-left: 12px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
          .kpi-value { font-size: 28px; font-weight: bold; margin: 8px 0; }
          .kpi-label { font-size: 14px; color: #64748b; }
          .suggestions { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; }
          .suggestions li { margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>AI 质量预测系统 - 质量分析报告</h1>
        <p style="text-align: center; color: #64748b;">生成时间: ${new Date().toLocaleString("zh-CN")}</p>
        ${reportContent}
        <div class="footer">
          <p>卓越汽车零部件有限公司 · AI质量预测与智能管控系统</p>
          <p>本报告由系统自动生成，仅供内部参考</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  const handleExportTXT = async () => {
    setExporting(true)
    await new Promise((r) => setTimeout(r, 800))
    const now = new Date().toLocaleString("zh-CN")
    const reportContent = `AI 质量预测系统 - 质量分析报告
生成时间: ${now}
======================================

【数据概览】
- 检验总批次: ${STATIC_QUALITY_STATS.total} 条
- 合格批次: ${STATIC_QUALITY_STATS.pass} 条
- 不合格批次: ${STATIC_QUALITY_STATS.fail} 条
- 综合合格率: ${STATIC_QUALITY_STATS.passRate}%

【缺陷分布】
${STATIC_QUALITY_STATS.defects.map((d) => `- ${d.type}: ${d.count} 条 (${((d.count / STATIC_QUALITY_STATS.total) * 100).toFixed(1)}%)`).join("\n")}

【工艺参数重要性排名（SHAP分析）】
${featureImportance.map((f, i) => `${i + 1}. ${featureLabels[f.feature] || f.feature}: ${(f.importance * 100).toFixed(1)}%`).join("\n")}

【改进建议】
1. 重点监控成型压力参数，其对质量影响最大
2. 加热温度需保持在 845-855°C 范围内
3. 建议加强对振动幅度超标设备的预防性维护
4. 每班次硬度抽检频率建议提高至每小时一次
`
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `质量分析报告_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">质量分析报告</h2>
          {lastUpdate && (
            <p className="text-xs text-slate-400 mt-0.5">最后更新: {lastUpdate}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFeatureImportance}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            打印/PDF
          </button>
          <button
            onClick={handleExportTXT}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {exporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />导出中...</>
            ) : (
              <><Download className="h-4 w-4" />导出报告</>
            )}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "检验总批次", value: STATIC_QUALITY_STATS.total, unit: "批", color: "text-slate-800" },
            { label: "合格批次", value: STATIC_QUALITY_STATS.pass, unit: "批", color: "text-green-600" },
            { label: "不合格批次", value: STATIC_QUALITY_STATS.fail, unit: "批", color: "text-red-600" },
            { label: "综合合格率", value: `${STATIC_QUALITY_STATS.passRate}%`, unit: "", color: "text-blue-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>
                {item.value}
                {item.unit && <span className="text-sm font-normal text-slate-400 ml-1">{item.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              质量合格率分布
            </h3>
            <ReactECharts option={qualityPieOption} style={{ height: 220 }} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">缺陷类型分布</h3>
            <ReactECharts option={defectBarOption} style={{ height: 220 }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            工艺参数影响力分析（SHAP 特征重要性）
          </h3>
          <p className="text-xs text-slate-400 mb-4">数值越大表示该参数对质量预测的影响程度越大</p>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          ) : featureBarOption ? (
            <ReactECharts option={featureBarOption} style={{ height: 200 }} />
          ) : null}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">🔔 AI 优化建议</h3>
          <ul className="space-y-2">
            {[
              "重点监控 成型压力（贡献率35%），建议设置自动报警阈值 ±5MPa",
              "加热温度 保持在 845-855°C 范围，偏差超过 ±3°C 触发预警",
              "振动幅度 超过 3.0mm/s 时建议立即检查设备润滑和轴承状态",
              "每批次 硬度 检测值应在 195-220 HB 区间，当前不合格率 8%",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}