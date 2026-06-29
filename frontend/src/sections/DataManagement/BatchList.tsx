import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, RefreshCw, FileSpreadsheet } from "lucide-react"
import { StatusBadge } from "../../components/charts/StatusBadge"
import type { QualityBatch, PaginatedResponse } from "../../types/batch"
import type { ApiResponse } from "../../types/api"

function toStatus(status: 0 | 1): "pass" | "fail" {
  return status === 0 ? "pass" : "fail"
}

const defectLabel: Record<string, string> = {
  "无缺陷": "无缺陷",
  "尺寸超差": "尺寸超差",
  "材料成分异常": "材料成分异常",
  "硬度不达标": "硬度不达标",
  none: "无缺陷",
  other: "其他",
  material_silicon: "硅含量异常",
}

interface BatchListProps {
  onView?: (batch: QualityBatch) => void
  onEdit?: (batch: QualityBatch) => void
  onAdd?: () => void
  refreshKey?: number
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
const PAGE_SIZE = 10

export function BatchList({ onView, onEdit, onAdd, refreshKey }: BatchListProps) {
  const [batches, setBatches] = useState<QualityBatch[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"" | "0" | "1">("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${BASE_URL}/data/?page=${currentPage}&per_page=${PAGE_SIZE}`
      )
      const json: ApiResponse<PaginatedResponse<QualityBatch>> = await res.json()
      if (json.code === 200 && json.data) {
        let rows = json.data.data || []
        if (filterStatus !== "") {
          rows = rows.filter((r) => String(r.quality_status) === filterStatus)
        }
        if (search.trim()) {
          const kw = search.trim().toLowerCase()
          rows = rows.filter(
            (r) =>
              r.batch_id.toLowerCase().includes(kw) ||
              r.material_batch_id.toLowerCase().includes(kw) ||
              r.inspector.toLowerCase().includes(kw)
          )
        }
        setBatches(rows)
        setTotal(json.data.total)
      }
    } catch {
      setError("加载数据失败，请检查后端服务是否启动")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, search])

  useEffect(() => {
    fetchData(page)
  }, [page, fetchData, refreshKey])

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要删除这条记录吗？")) return
    setDeletingId(id)
    try {
      const res = await fetch(`${BASE_URL}/data/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.code === 200) {
        fetchData(page)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCSV = () => {
    if (batches.length === 0) {
      alert("没有数据可导出")
      return
    }
    setExporting(true)
    try {
      const headers = [
        "批次编号", "材料批次", "质量状态", "缺陷类型", "根因",
        "厚度(mm)", "平行度(mm)", "硬度(HB)", "表面粗糙度(μm)",
        "检验员", "检验时间"
      ]

      const rows = batches.map(batch => [
        batch.batch_id,
        batch.material_batch_id,
        batch.quality_status === 0 ? "合格" : "不合格",
        defectLabel[batch.defect_type] || batch.defect_type,
        batch.root_cause,
        batch.thickness,
        batch.parallelism,
        batch.hardness,
        batch.surface_roughness,
        batch.inspector,
        batch.inspection_time?.slice(0, 16).replace("T", " ") || ""
      ])

      const escapeCSV = (value: string | number) => {
        const str = String(value)
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
      ].join("\n")

      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `批次数据_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert("导出失败：" + (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索批次号 / 材料批次 / 检验员..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-72 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as "" | "0" | "1"); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">全部状态</option>
            <option value="0">合格</option>
            <option value="1">不合格</option>
          </select>
          <button
            onClick={() => fetchData(page)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="刷新"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || batches.length === 0}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            {exporting ? (
              <><RefreshCw className="h-4 w-4 animate-spin" />导出中...</>
            ) : (
              <><FileSpreadsheet className="h-4 w-4" />导出CSV</>
            )}
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            新增批次
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">批次编号</th>
                <th className="px-4 py-3 text-left">材料批次</th>
                <th className="px-4 py-3 text-center">质量状态</th>
                <th className="px-4 py-3 text-left">缺陷类型</th>
                <th className="px-4 py-3 text-right">厚度(mm)</th>
                <th className="px-4 py-3 text-right">硬度(HB)</th>
                <th className="px-4 py-3 text-right">表面粗糙度</th>
                <th className="px-4 py-3 text-left">检验员</th>
                <th className="px-4 py-3 text-left">检验时间</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    暂无数据，请先导入数据或调整筛选条件
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">
                      {batch.batch_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {batch.material_batch_id}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={toStatus(batch.quality_status)} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {defectLabel[batch.defect_type] || batch.defect_type}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(batch.thickness).toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(batch.hardness).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(batch.surface_roughness).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{batch.inspector}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {batch.inspection_time?.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onView?.(batch)}
                          className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(batch)}
                          className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="编辑"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          disabled={deletingId === batch.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">
            共 <strong>{total}</strong> 条记录
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                    p === page
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}