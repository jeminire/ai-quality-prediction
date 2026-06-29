import { useState, useRef } from "react"
import { Search, Filter, Download, RefreshCw, Upload, Trash2, X } from "lucide-react"
import { useTableData } from "@/hooks/useTableData"

interface ProcessDataItem {
  id: number
  record_id: string
  batch_id: string
  timestamp: string
  heating_temperature: number
  forming_pressure: number
  spindle_speed: number
  coolant_flow: number
  vibration_amplitude: number
  current_intensity: number
  mold_temperature: number
  feed_rate: number
  lubricant_flow: number
  clamp_force: number
  equipment_id: string
  operator_id: string
}

export default function ProcessData() {
  const { data, loading, total, error, refresh, currentPage, totalPages, goToPage, goToNextPage, goToPrevPage, goToFirstPage, goToLastPage, getPageNumbers } = useTableData<ProcessDataItem>("/data/process_data")
  const [searchTerm, setSearchTerm] = useState("")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filterEquipment, setFilterEquipment] = useState("")
  const [filterOperator, setFilterOperator] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 获取唯一的设备和操作员列表
  const uniqueEquipment = Array.from(new Set(data.map(item => item.equipment_id))).filter(Boolean)
  const uniqueOperators = Array.from(new Set(data.map(item => item.operator_id))).filter(Boolean)

  const filteredData = data.filter(item => {
    // 文本搜索
    const matchesSearch = 
      item.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 设备筛选
    const matchesEquipment = !filterEquipment || item.equipment_id === filterEquipment
    
    // 操作员筛选
    const matchesOperator = !filterOperator || item.operator_id === filterOperator
    
    // 日期范围筛选
    const itemDate = new Date(item.timestamp)
    const matchesStartDate = !filterStartDate || itemDate >= new Date(filterStartDate)
    const matchesEndDate = !filterEndDate || itemDate <= new Date(filterEndDate + 'T23:59:59')
    
    return matchesSearch && matchesEquipment && matchesOperator && matchesStartDate && matchesEndDate
  })

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
      const response = await fetch(`${BASE_URL}/data/upload/process`, {
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
      const response = await fetch(`${BASE_URL}/data/process_data/${id}`, {
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
      const response = await fetch(`${BASE_URL}/data/process_data?page=1&per_page=100000`)
      
      const result = await response.json()
      if (result.code === 200) {
        const allData = result.data.data
        
        // 定义CSV表头
        const headers = [
          'record_id', 'batch_id', 'timestamp', 'heating_temperature',
          'forming_pressure', 'spindle_speed', 'coolant_flow',
          'vibration_amplitude', 'current_intensity', 'mold_temperature',
          'feed_rate', 'lubricant_flow', 'clamp_force',
          'equipment_id', 'operator_id'
        ]
        
        // 创建CSV内容
        const csvContent = [
          headers.join(','),
          ...allData.map((item: ProcessDataItem) => 
            headers.map(header => {
              const value = item[header as keyof ProcessDataItem]
              // 如果值包含逗号、引号或换行符，需要用引号包裹
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value ?? ''
            }).join(',')
          )
        ].join('\n')
        
        // 创建Blob并下载
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `process_data_${new Date().toISOString().slice(0, 10)}.csv`
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
          <h2 className="text-xl font-bold text-slate-800">工艺参数表</h2>
          <p className="text-sm text-slate-500 mt-1">生产线实时采集的工艺参数数据</p>
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
            placeholder="搜索记录ID、批次号或设备ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
            showFilter || filterEquipment || filterOperator || filterStartDate || filterEndDate
              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
              : 'text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {(filterEquipment || filterOperator || filterStartDate || filterEndDate) && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {[filterEquipment, filterOperator, filterStartDate, filterEndDate].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>
      
      {/* 筛选面板 */}
      {showFilter && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">设备ID</label>
              <select
                value={filterEquipment}
                onChange={(e) => setFilterEquipment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部设备</option>
                {uniqueEquipment.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">操作员</label>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部操作员</option>
                {uniqueOperators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">开始日期</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">结束日期</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilterEquipment("")
                setFilterOperator("")
                setFilterStartDate("")
                setFilterEndDate("")
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">记录ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">批次号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">时间戳</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">加热温度(°C)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">成型压力(MPa)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">主轴转速(rpm)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">设备ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作员ID</th>
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
                  <tr key={item.id || item.record_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.record_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.batch_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.timestamp}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.heating_temperature}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.forming_pressure}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.spindle_speed}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.equipment_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.operator_id}</td>
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