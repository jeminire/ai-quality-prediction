import { useState, useRef } from "react"
import { Search, Filter, Download, RefreshCw, Upload, Trash2 } from "lucide-react"
import { useTableData } from "@/hooks/useTableData"

interface QualityLabelItem {
  id: number
  batch_id: string
  material_batch_id: string
  quality_status: number
  defect_type: string
  root_cause: string
  thickness: number
  parallelism: number
  hardness: number
  surface_roughness: number
  inspection_time: string
  inspector: string
}

export default function QualityLabel() {
  const { data, loading, total, error, refresh, currentPage, totalPages, goToPage, goToNextPage, goToPrevPage, goToFirstPage, goToLastPage, getPageNumbers } = useTableData<QualityLabelItem>("/data/quality_label")
  const [searchTerm, setSearchTerm] = useState("")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterQualityStatus, setFilterQualityStatus] = useState<number | "">("")
  const [filterDefectType, setFilterDefectType] = useState("")
  const [filterInspector, setFilterInspector] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const uniqueDefectTypes = Array.from(new Set(data.map(item => item.defect_type))).filter(Boolean)
  const uniqueInspectors = Array.from(new Set(data.map(item => item.inspector))).filter(Boolean)

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.material_batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesQualityStatus = filterQualityStatus === "" || item.quality_status === filterQualityStatus
    const matchesDefectType = !filterDefectType || item.defect_type === filterDefectType
    const matchesInspector = !filterInspector || item.inspector === filterInspector
    return matchesSearch && matchesQualityStatus && matchesDefectType && matchesInspector
  })

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
      const response = await fetch(`${BASE_URL}/data/upload/quality`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      if (result.code === 200) {
        alert(`成功导入 ${result.data.imported_count} 条数据`)
        refresh()
      } else {
        alert(result.message || '导入失败')
      }
    } catch (err) {
      alert('导入失败，请检查后端服务是否运行')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条数据吗？')) return
    
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
      const response = await fetch(`${BASE_URL}/data/quality_label/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.code === 200) {
        alert('删除成功')
        refresh()
      } else {
        alert(result.message || '删除失败')
      }
    } catch (err) {
      alert('删除失败，请检查后端服务是否运行')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
      const response = await fetch(`${BASE_URL}/data/quality_label?page=1&per_page=100000`)
      
      const result = await response.json()
      if (result.code === 200) {
        const allData = result.data.data
        
        const headers = [
          'batch_id', 'material_batch_id', 'quality_status', 'defect_type',
          'root_cause', 'thickness', 'parallelism', 'hardness',
          'surface_roughness', 'inspection_time', 'inspector'
        ]
        
        const csvContent = [
          headers.join(','),
          ...allData.map((item: QualityLabelItem) => 
            headers.map(header => {
              const value = item[header as keyof QualityLabelItem]
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value ?? ''
            }).join(',')
          )
        ].join('\n')
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `quality_label_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert(`成功导出 ${allData.length} 条数据`)
      } else {
        alert(result.message || '导出失败')
      }
    } catch (err) {
      alert('导出失败，请检查后端服务是否运行')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">质量标签表</h2>
          <p className="text-sm text-slate-500 mt-1">最终产品质量检验结果</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? '导入中...' : '导入'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索批次号、物料批次ID或检验员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
            showFilter || filterQualityStatus !== "" || filterDefectType || filterInspector
              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
              : 'text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {([filterQualityStatus, filterDefectType, filterInspector].filter(v => v !== "" && v !== undefined).length) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {[filterQualityStatus, filterDefectType, filterInspector].filter(v => v !== "" && v !== undefined).length}
            </span>
          )}
        </button>
      </div>
      
      {showFilter && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">质量状态</label>
              <select
                value={filterQualityStatus}
                onChange={(e) => setFilterQualityStatus(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="0">合格</option>
                <option value="1">不合格</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">缺陷类型</label>
              <select
                value={filterDefectType}
                onChange={(e) => setFilterDefectType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部类型</option>
                {uniqueDefectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">检验员</label>
              <select
                value={filterInspector}
                onChange={(e) => setFilterInspector(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部检验员</option>
                {uniqueInspectors.map(ins => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilterQualityStatus("")
                setFilterDefectType("")
                setFilterInspector("")
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              清除筛选
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">批次号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">物料批次ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">质量状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">缺陷类型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">根本原因</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">厚度(mm)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">硬度(HB)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">检验员</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">暂无数据</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id || item.batch_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.batch_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.material_batch_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.quality_status === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.quality_status === 0 ? '合格' : '缺陷'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.defect_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.root_cause === 'none' ? '无' : item.root_cause}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.thickness}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.hardness}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.inspector}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              显示第 {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, total)} 条，共 {total} 条记录
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="首页"
              >
                «
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="上一页"
              >
                ‹
              </button>
              {getPageNumbers().map((page, index) => (
                <span key={index}>
                  {typeof page === 'number' ? (
                    <button
                      onClick={() => goToPage(page)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span className="px-1 text-slate-400 text-xs">...</span>
                  )}
                </span>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="下一页"
              >
                ›
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="末页"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}