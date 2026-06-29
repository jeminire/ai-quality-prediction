import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import ReactECharts from "echarts-for-react"
import {
  Database, FlaskConical, CheckCircle, Wrench, CloudSun,
  RefreshCw, ArrowRight, Layers
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"

interface PaginatedResponse<T> {
  data: T[]
  total: number
}

interface QualityItem { quality_status: number; defect_type: string }
interface EquipmentItem { status: string; equipment_id: string }
interface EnvironmentItem { timestamp: string; temperature: number; humidity: number }
interface ProcessItem { timestamp: string; heating_temperature: number; forming_pressure: number }

const MODULES = [
  { label: "工艺参数", desc: "process_data", icon: Database, href: "/data/process", color: "blue" },
  { label: "物料批次", desc: "material_batch", icon: FlaskConical, href: "/data/material", color: "purple" },
  { label: "质量标签", desc: "quality_label", icon: CheckCircle, href: "/data/quality", color: "green" },
  { label: "设备状态", desc: "equipment_status", icon: Wrench, href: "/data/equipment", color: "orange" },
  { label: "环境参数", desc: "environment_data", icon: CloudSun, href: "/data/environment", color: "cyan" },
] as const

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100" },
}

export default function DataPlatform() {
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [qualityData, setQualityData] = useState<QualityItem[]>([])
  const [equipmentData, setEquipmentData] = useState<EquipmentItem[]>([])
  const [environmentData, setEnvironmentData] = useState<EnvironmentItem[]>([])
  const [processData, setProcessData] = useState<ProcessItem[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [process, material, quality, equipment, environment] = await Promise.all([
        apiClient.get<PaginatedResponse<ProcessItem>>("/data/process_data?page=1&per_page=30"),
        apiClient.get<PaginatedResponse<unknown>>("/data/material_batch?page=1&per_page=1"),
        apiClient.get<PaginatedResponse<QualityItem>>("/data/quality_label?page=1&per_page=100"),
        apiClient.get<PaginatedResponse<EquipmentItem>>("/data/equipment_status?page=1&per_page=100"),
        apiClient.get<PaginatedResponse<EnvironmentItem>>("/data/environment_data?page=1&per_page=30"),
      ])
      setTotals({
        process: process.total,
        material: material.total,
        quality: quality.total,
        equipment: equipment.total,
        environment: environment.total,
      })
      setProcessData(process.data ?? [])
      setQualityData(quality.data ?? [])
      setEquipmentData(equipment.data ?? [])
      setEnvironmentData(environment.data ?? [])
    } catch {
      setTotals({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const passCount = qualityData.filter(q => q.quality_status === 0).length
  const failCount = qualityData.filter(q => q.quality_status === 1).length

  const equipmentStatusCount = equipmentData.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const statusLabels: Record<string, string> = {
    RUNNING: "运行中", MAINTENANCE: "维护中", WARNING: "告警", IDLE: "空闲",
  }

  const dataVolumeOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: "category",
      data: MODULES.map(m => m.label),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: "value", name: "记录数" },
    series: [{
      type: "bar",
      data: [
        { value: totals.process ?? 0, itemStyle: { color: "#3b82f6" } },
        { value: totals.material ?? 0, itemStyle: { color: "#8b5cf6" } },
        { value: totals.quality ?? 0, itemStyle: { color: "#22c55e" } },
        { value: totals.equipment ?? 0, itemStyle: { color: "#f97316" } },
        { value: totals.environment ?? 0, itemStyle: { color: "#06b6d4" } },
      ],
      barWidth: "50%",
    }],
  }

  const qualityPieOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [{
      type: "pie",
      radius: ["40%", "65%"],
      data: [
        { name: "合格", value: passCount, itemStyle: { color: "#22c55e" } },
        { name: "缺陷", value: failCount, itemStyle: { color: "#ef4444" } },
      ],
    }],
  }

  const equipmentPieOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [{
      type: "pie",
      radius: ["40%", "65%"],
      data: Object.entries(equipmentStatusCount).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      })),
    }],
  }

  const sortedEnv = [...environmentData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const envTrendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["温度(°C)", "湿度(%)"], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: sortedEnv.map(d => d.timestamp?.slice(5, 16) ?? ""),
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: { type: "value" },
    series: [
      { name: "温度(°C)", type: "line", smooth: true, data: sortedEnv.map(d => d.temperature), itemStyle: { color: "#f97316" } },
      { name: "湿度(%)", type: "line", smooth: true, data: sortedEnv.map(d => d.humidity), itemStyle: { color: "#3b82f6" } },
    ],
  }

  const sortedProcess = [...processData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const processTrendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["加热温度", "成型压力"], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: sortedProcess.map(d => d.timestamp?.slice(5, 16) ?? ""),
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: { type: "value" },
    series: [
      { name: "加热温度", type: "line", smooth: true, data: sortedProcess.map(d => d.heating_temperature), itemStyle: { color: "#ef4444" } },
      { name: "成型压力", type: "line", smooth: true, data: sortedProcess.map(d => d.forming_pressure), itemStyle: { color: "#8b5cf6" } },
    ],
  }

  const totalRecords = Object.values(totals).reduce((s, v) => s + v, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            数据中台与看板
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            整合工艺参数、物料批次、质量标签、设备状态、环境参数多源数据，实现统一监控与可视化
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 总览 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-3 lg:col-span-1 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 shadow-sm">
          <p className="text-xs text-blue-100">数据总量</p>
          <p className="text-2xl font-bold mt-1">{totalRecords.toLocaleString()}</p>
          <p className="text-xs text-blue-200 mt-1">5 张数据表</p>
        </div>
        {MODULES.map((mod, i) => {
          const keys = ["process", "material", "quality", "equipment", "environment"] as const
          const c = colorMap[mod.color]
          const Icon = mod.icon
          return (
            <Link
              key={mod.href}
              to={mod.href}
              className={`rounded-xl border ${c.border} bg-white p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`${c.bg} p-1.5 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <span className="text-xs text-slate-500">{mod.label}</span>
              </div>
              <p className={`text-xl font-bold ${c.text}`}>
                {(totals[keys[i]] ?? 0).toLocaleString()}
              </p>
            </Link>
          )
        })}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">多源数据量分布</h3>
          <ReactECharts option={dataVolumeOption} style={{ height: 260 }} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">质量标签分布</h3>
          <ReactECharts option={qualityPieOption} style={{ height: 260 }} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">设备运行状态</h3>
          <ReactECharts option={equipmentPieOption} style={{ height: 260 }} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">环境参数趋势</h3>
          <ReactECharts option={envTrendOption} style={{ height: 260 }} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">工艺参数趋势</h3>
          <ReactECharts option={processTrendOption} style={{ height: 280 }} />
        </div>
      </div>

      {/* 子模块快捷入口 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">数据子模块</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {MODULES.map((mod) => {
            const c = colorMap[mod.color]
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                to={mod.href}
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`${c.bg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
