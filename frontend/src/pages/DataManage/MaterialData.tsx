import { useState, useRef } from "react"
import { Search, Filter, Download, RefreshCw, Upload, Trash2 } from "lucide-react"
import { useTableData } from "@/hooks/useTableData"

interface MaterialDataItem {
  id: number
  material_batch_id: string
  supplier: string
  material_type: string
  carbon_content: number
  silicon_content: number
  manganese_content: number
  phosphorus_content: number
  sulfur_content: number
  raw_hardness: number
  tensile_strength: number
  inspection_date: string
  material_status: string
  risk_reason: string
  storage_temperature: number
  storage_humidity: number
}

export default function MaterialData() {
  const { data, loading, total, error, refresh, currentPage, totalPages, goToPage, goToNextPage, goToPrevPage, goToFirstPage, goToLastPage, getPageNumbers } = useTableData<MaterialDataItem>("/data/material_batch")
  const [searchTerm, setSearchTerm] = useState("")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterSupplier, setFilterSupplier] = useState("")
  const [filterMaterialType, setFilterMaterialType] = useState("")
  const [filterMaterialStatus, setFilterMaterialStatus] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const uniqueSuppliers = Array.from(new Set(data.map(item => item.supplier))).filter(Boolean)
  const uniqueMaterialTypes = Array.from(new Set(data.map(item => item.material_type))).filter(Boolean)
  const uniqueMaterialStatuses = Array.from(new Set(data.map(item => item.material_status))).filter(Boolean)

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.material_batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.material_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = !filterSupplier || item.supplier === filterSupplier
    const matchesMaterialType = !filterMaterialType || item.material_type === filterMaterialType
    const matchesMaterialStatus = !filterMaterialStatus || item.material_status === filterMaterialStatus
    return matchesSearch && matchesSupplier && matchesMaterialType && matchesMaterialStatus
  })

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
      const response = await fetch(`${BASE_URL}/data/upload/material`, {
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
      const response = await fetch(`${BASE_URL}/data/material_batch/${id}`, {
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
      const response = await fetch(`${BASE_URL}/data/material_batch?page=1&per_page=100000`)
      
      const result = await response.json()
      if (result.code === 200) {
        const allData = result.data.data
        
        const headers = [
          'material_batch_id', 'supplier', 'material_type', 'carbon_content',
          'silicon_content', 'manganese_content', 'phosphorus_content',
          'sulfur_content', 'raw_hardness', 'tensile_strength',
          'inspection_date', 'material_status', 'risk_reason',
          'storage_temperature', 'storage_humidity'
        ]
        
        const csvContent = [
          headers.join(','),
          ...allData.map((item: MaterialDataItem) => 
            headers.map(header => {
              const value = item[header as keyof MaterialDataItem]
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
        link.download = `material_data_${new Date().toISOString().slice(0, 10)}.csv`
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
          <h2 className="text-xl font-bold text-slate-800">物料批次表</h2>
          <p className="text-sm text-slate-500 mt-1">原材料批次信息</p>
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
            placeholder="搜索物料批次ID、供应商或材料类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
            showFilter || filterSupplier || filterMaterialType || filterMaterialStatus
              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
              : 'text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {(filterSupplier || filterMaterialType || filterMaterialStatus) && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {[filterSupplier, filterMaterialType, filterMaterialStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>
      
      {showFilter && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">供应商</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部供应商</option>
                {uniqueSuppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">材料类型</label>
              <select
                value={filterMaterialType}
                onChange={(e) => setFilterMaterialType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部类型</option>
                {uniqueMaterialTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">物料状态</label>
              <select
                value={filterMaterialStatus}
                onChange={(e) => setFilterMaterialStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                {uniqueMaterialStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilterSupplier("")
                setFilterMaterialType("")
                setFilterMaterialStatus("")
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">物料批次ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">材料类型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">碳含量(%)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">硅含量(%)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">硬度(HB)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">检验日期</th>
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
                  <tr key={item.id || item.material_batch_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.material_batch_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.supplier}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.material_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.carbon_content}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.silicon_content}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.raw_hardness}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.material_status === 'NORMAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.material_status === 'NORMAL' ? '正常' : '风险'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.inspection_date}</td>
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